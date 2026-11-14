import { and, eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import type { Transaction } from "@/db/client";
import { currencies, tripDestinations, trips } from "@/db/schema";
import {
  AuthorizationError,
  NotFoundError,
  TripArchivedError,
  ValidationError,
} from "@/lib/errors";
import {
  insertMember,
  insertTestCurrency,
  insertTrip,
  insertUser,
  TEST_CURRENCY,
} from "@/test/integration/fixtures";
import { createTestDb, withRollback } from "@/test/integration/test-database";
import { setTripArchived } from "./set-trip-archived";
import { updateTripSettings } from "./update-trip-settings";

const { db, pool } = createTestDb();
afterAll(() => pool.end());

const SECOND_CURRENCY = { code: "XQA", name: "Second test currency", minorUnits: 0 };

const settings = {
  name: "Kyoto & Osaka",
  destination: "Kyoto, Japan",
  startDate: "2026-12-01",
  endDate: "2026-12-05",
  timezone: "Asia/Tokyo",
  baseCurrency: SECOND_CURRENCY.code,
};

async function setup(tx: Transaction) {
  await insertTestCurrency(tx);
  await tx.insert(currencies).values(SECOND_CURRENCY).onConflictDoNothing();
  const owner = await insertUser(tx, "Owner");
  const trip = await insertTrip(tx, owner.id, { destination: "Tokyo, Japan" });
  return { owner, trip };
}

async function tripRow(tx: Transaction, id: string) {
  const [row] = await tx.select().from(trips).where(eq(trips.id, id));
  return row!;
}

async function primaryDestination(tx: Transaction, id: string) {
  const [row] = await tx
    .select()
    .from(tripDestinations)
    .where(and(eq(tripDestinations.tripId, id), eq(tripDestinations.sortOrder, 0)));
  return row!;
}

async function errorOf(call: Promise<unknown>) {
  return call.then(
    () => undefined,
    (error: unknown) => error,
  );
}

describe("updateTripSettings (Slice 1.5)", () => {
  it("lets the OWNER change every field, including the primary destination", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);
      const before = await tripRow(tx, trip.id);

      await updateTripSettings(tx, owner, trip.id, settings);

      const after = await tripRow(tx, trip.id);
      expect(after).toMatchObject({
        name: "Kyoto & Osaka",
        startDate: "2026-12-01",
        endDate: "2026-12-05",
        timezone: "Asia/Tokyo",
        baseCurrencyCode: "XQA",
      });
      expect(after.updatedAt.getTime()).toBeGreaterThanOrEqual(before.updatedAt.getTime());
      expect((await primaryDestination(tx, trip.id)).name).toBe("Kyoto, Japan");
      // Still exactly one primary destination.
      const all = await tx
        .select()
        .from(tripDestinations)
        .where(eq(tripDestinations.tripId, trip.id));
      expect(all).toHaveLength(1);
    });
  });

  it("sets and clears the status override (D7); omitting it leaves it unchanged", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);

      await updateTripSettings(tx, owner, trip.id, { ...settings, statusOverride: "COMPLETED" });
      expect((await tripRow(tx, trip.id)).statusOverride).toBe("COMPLETED");

      await updateTripSettings(tx, owner, trip.id, settings);
      expect((await tripRow(tx, trip.id)).statusOverride).toBe("COMPLETED");

      await updateTripSettings(tx, owner, trip.id, { ...settings, statusOverride: "" });
      expect((await tripRow(tx, trip.id)).statusOverride).toBeNull();
    });
  });

  it("validates like Create Trip and writes nothing on failure", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);
      const error = await errorOf(
        updateTripSettings(tx, owner, trip.id, {
          ...settings,
          timezone: "Mars/Olympus_Mons",
          startDate: "2026-12-05",
          endDate: "2026-12-01",
        }),
      );
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toEqual({
        timezone: "Choose a timezone from the list",
        endDate: "End date can’t be before the start date",
      });
      expect((await tripRow(tx, trip.id)).name).toBe(trip.name);
    });
  });

  it("rejects switching to an inactive currency but allows keeping the current one", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);
      await tx
        .update(currencies)
        .set({ active: false })
        .where(eq(currencies.code, SECOND_CURRENCY.code));

      const error = await errorOf(updateTripSettings(tx, owner, trip.id, settings));
      expect((error as ValidationError).fieldErrors).toEqual({
        baseCurrency: "Choose a currency from the list",
      });

      // The trip's own currency was deactivated after creation: edits still work.
      await tx
        .update(currencies)
        .set({ active: false })
        .where(eq(currencies.code, TEST_CURRENCY.code));
      await updateTripSettings(tx, owner, trip.id, {
        ...settings,
        baseCurrency: TEST_CURRENCY.code,
      });
      expect((await tripRow(tx, trip.id)).name).toBe(settings.name);
    });
  });

  it("rejects a MEMBER with AuthorizationError and a non-member with NotFoundError", async () => {
    await withRollback(db, async (tx) => {
      const { trip } = await setup(tx);
      const member = await insertUser(tx, "Member");
      await insertMember(tx, trip.id, { userId: member.id, role: "MEMBER" });
      const stranger = await insertUser(tx, "Stranger");

      expect(await errorOf(updateTripSettings(tx, member, trip.id, settings))).toBeInstanceOf(
        AuthorizationError,
      );
      // User A cannot update User B's trip: same response as a missing trip.
      expect(await errorOf(updateTripSettings(tx, stranger, trip.id, settings))).toBeInstanceOf(
        NotFoundError,
      );
      expect((await tripRow(tx, trip.id)).name).toBe(trip.name);
    });
  });

  it("is atomic: a failing destination update rolls back the trip update", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);
      await tx.execute(sql`
        create or replace function pg_temp.tripmate_test_fail() returns trigger
        language plpgsql as $$ begin raise exception 'forced failure'; end $$
      `);
      await tx.execute(
        sql.raw(
          "create trigger tripmate_test_fail before update on trip_destinations " +
            "for each row execute function pg_temp.tripmate_test_fail()",
        ),
      );

      await expect(updateTripSettings(tx, owner, trip.id, settings)).rejects.toThrow();
      const after = await tripRow(tx, trip.id);
      expect(after.name).toBe(trip.name);
      expect(after.baseCurrencyCode).toBe(trip.baseCurrencyCode);
    });
  });
});

describe("archive / unarchive (D16) and archived trips are read-only (D22)", () => {
  it("archive sets archived_at and unarchive clears it", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);

      await setTripArchived(tx, owner, trip.id, true);
      const archivedAt = (await tripRow(tx, trip.id)).archivedAt;
      expect(archivedAt).toBeInstanceOf(Date);

      // Archiving again keeps the original timestamp.
      await setTripArchived(tx, owner, trip.id, true);
      expect((await tripRow(tx, trip.id)).archivedAt).toEqual(archivedAt);

      await setTripArchived(tx, owner, trip.id, false);
      expect((await tripRow(tx, trip.id)).archivedAt).toBeNull();
    });
  });

  it("rejects a settings update on an archived trip with a clear error", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);
      await setTripArchived(tx, owner, trip.id, true);

      const error = await errorOf(updateTripSettings(tx, owner, trip.id, settings));
      expect(error).toBeInstanceOf(TripArchivedError);
      expect((error as Error).message).toBe("This trip is archived. Unarchive it to make changes.");
      expect((await tripRow(tx, trip.id)).name).toBe(trip.name);
      expect((await primaryDestination(tx, trip.id)).name).toBe("Tokyo, Japan");
    });
  });

  it("allows the OWNER to unarchive, after which edits work again", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);
      await setTripArchived(tx, owner, trip.id, true);
      await setTripArchived(tx, owner, trip.id, false);
      await updateTripSettings(tx, owner, trip.id, settings);
      expect((await tripRow(tx, trip.id)).name).toBe(settings.name);
    });
  });

  it("rejects archive and unarchive by a MEMBER, and by a non-member", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await setup(tx);
      const member = await insertUser(tx, "Member");
      await insertMember(tx, trip.id, { userId: member.id, role: "MEMBER" });
      const stranger = await insertUser(tx, "Stranger");

      expect(await errorOf(setTripArchived(tx, member, trip.id, true))).toBeInstanceOf(
        AuthorizationError,
      );
      expect(await errorOf(setTripArchived(tx, stranger, trip.id, true))).toBeInstanceOf(
        NotFoundError,
      );
      expect((await tripRow(tx, trip.id)).archivedAt).toBeNull();

      await setTripArchived(tx, owner, trip.id, true);
      expect(await errorOf(setTripArchived(tx, member, trip.id, false))).toBeInstanceOf(
        AuthorizationError,
      );
      expect((await tripRow(tx, trip.id)).archivedAt).not.toBeNull();
    });
  });
});
