import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import type { Transaction } from "@/db/client";
import { currencies, tripDestinations, tripMembers, trips } from "@/db/schema";
import { ValidationError } from "@/lib/errors";
import { insertTestCurrency, insertUser, TEST_CURRENCY } from "@/test/integration/fixtures";
import { createTestDb, withRollback } from "@/test/integration/test-database";
import { createTrip } from "./create-trip";

const { db, pool } = createTestDb();
afterAll(() => pool.end());

const input = {
  name: "Tokyo Autumn Trip",
  destination: "Tokyo, Japan",
  startDate: "2026-11-15",
  endDate: "2026-11-21",
  timezone: "Asia/Tokyo",
  baseCurrency: TEST_CURRENCY.code,
};

async function tripsCreatedBy(tx: Transaction, userId: string) {
  return tx.select().from(trips).where(eq(trips.createdBy, userId));
}

/**
 * Makes the next INSERT into `table` fail, to prove the transaction leaves
 * nothing behind. DDL is transactional in PostgreSQL, so the trigger disappears
 * with the test's rollback.
 */
async function failInsertsInto(tx: Transaction, table: "trip_members" | "trip_destinations") {
  await tx.execute(sql`
    create or replace function pg_temp.tripmate_test_fail() returns trigger
    language plpgsql as $$ begin raise exception 'forced failure'; end $$
  `);
  await tx.execute(
    sql.raw(
      `create trigger tripmate_test_fail before insert on ${table} ` +
        `for each row execute function pg_temp.tripmate_test_fail()`,
    ),
  );
}

describe("createTrip (Slice 1.3)", () => {
  it("creates the trip, an ACTIVE OWNER membership, and the primary destination", async () => {
    await withRollback(db, async (tx) => {
      await insertTestCurrency(tx);
      const user = await insertUser(tx);
      const before = Date.now();

      const { tripId } = await createTrip(tx, user, input);

      const [trip] = await tx.select().from(trips).where(eq(trips.id, tripId));
      expect(trip).toMatchObject({
        name: "Tokyo Autumn Trip",
        startDate: "2026-11-15",
        endDate: "2026-11-21",
        timezone: "Asia/Tokyo",
        baseCurrencyCode: "XTS",
        statusOverride: null,
        archivedAt: null,
        createdBy: user.id,
      });

      const members = await tx.select().from(tripMembers).where(eq(tripMembers.tripId, tripId));
      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({ userId: user.id, role: "OWNER", status: "ACTIVE" });
      expect(members[0]!.joinedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);

      const destinations = await tx
        .select()
        .from(tripDestinations)
        .where(eq(tripDestinations.tripId, tripId));
      expect(destinations).toHaveLength(1);
      expect(destinations[0]).toMatchObject({ name: "Tokyo, Japan", sortOrder: 0 });
    });
  });

  it.each(["trip_members", "trip_destinations"] as const)(
    "leaves nothing behind when inserting into %s fails",
    async (table) => {
      await withRollback(db, async (tx) => {
        await insertTestCurrency(tx);
        const user = await insertUser(tx);
        await failInsertsInto(tx, table);

        await expect(createTrip(tx, user, input)).rejects.toThrow();

        expect(await tripsCreatedBy(tx, user.id)).toEqual([]);
        const orphans = await tx
          .select({ id: tripMembers.id })
          .from(tripMembers)
          .where(eq(tripMembers.userId, user.id));
        expect(orphans).toEqual([]);
      });
    },
  );

  it("rejects an unknown or inactive currency with a field error and writes nothing", async () => {
    await withRollback(db, async (tx) => {
      const user = await insertUser(tx);
      await tx
        .insert(currencies)
        .values({ code: "QQQ", name: "Retired", minorUnits: 2, active: false })
        .onConflictDoUpdate({ target: currencies.code, set: { active: false } });

      for (const baseCurrency of ["QQQ", "ZZZ"]) {
        const error = await createTrip(tx, user, { ...input, baseCurrency }).catch((e) => e);
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).fieldErrors).toEqual({
          baseCurrency: "Choose a currency from the list",
        });
      }
      expect(await tripsCreatedBy(tx, user.id)).toEqual([]);
    });
  });

  it("rejects invalid input (timezone, dates) before touching the database", async () => {
    await withRollback(db, async (tx) => {
      await insertTestCurrency(tx);
      const user = await insertUser(tx);

      const error = await createTrip(tx, user, {
        ...input,
        timezone: "Mars/Olympus_Mons",
        startDate: "2026-11-21",
        endDate: "2026-11-15",
      }).catch((e) => e);

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toMatchObject({
        timezone: "Choose a timezone from the list",
      });
      expect(await tripsCreatedBy(tx, user.id)).toEqual([]);
    });
  });

  it("accepts a one-day trip and a trip already in progress", async () => {
    await withRollback(db, async (tx) => {
      await insertTestCurrency(tx);
      const user = await insertUser(tx);

      await createTrip(tx, user, { ...input, startDate: "2026-11-15", endDate: "2026-11-15" });
      await createTrip(tx, user, { ...input, startDate: "2026-11-01", endDate: "2027-01-01" });

      expect(await tripsCreatedBy(tx, user.id)).toHaveLength(2);
    });
  });
});
