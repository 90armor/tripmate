import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import {
  createTestDb,
  expectConstraintViolation,
  withRollback,
} from "@/test/integration/test-database";
import { currencies, tripMembers, trips, users } from "./schema";

// XTS is the ISO 4217 code reserved for testing. All rows are rolled back.
const TEST_CURRENCY = { code: "XTS", name: "Test currency", symbol: null, minorUnits: 2 };

const { db, pool } = createTestDb();
afterAll(() => pool.end());

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertUser(tx: Tx, email: string) {
  const [user] = await tx.insert(users).values({ email, displayName: "Test Traveler" }).returning();
  return user!;
}

async function insertTrip(
  tx: Tx,
  createdBy: string,
  dates = { start: "2026-11-15", end: "2026-11-20" },
) {
  const [trip] = await tx
    .insert(trips)
    .values({
      name: "Tokyo test trip",
      startDate: dates.start,
      endDate: dates.end,
      timezone: "Asia/Tokyo",
      baseCurrencyCode: TEST_CURRENCY.code,
      createdBy,
    })
    .returning();
  return trip!;
}

async function seedTrip(tx: Tx) {
  await tx.insert(currencies).values(TEST_CURRENCY);
  const owner = await insertUser(tx, "owner@example.com");
  const trip = await insertTrip(tx, owner.id);
  return { owner, trip };
}

describe("foundation schema (real PostgreSQL)", () => {
  it("stores a trip with an owner membership and DB-generated UUIDs", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await seedTrip(tx);
      const [member] = await tx
        .insert(tripMembers)
        .values({ tripId: trip.id, userId: owner.id, role: "OWNER" })
        .returning();

      expect(owner.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(member!.status).toBe("ACTIVE");
      // DATE columns round-trip as plain calendar strings, never shifted by timezone.
      expect(trip.startDate).toBe("2026-11-15");
      expect(trip.endDate).toBe("2026-11-20");
    });
  });

  it("rejects a trip that ends before it starts", async () => {
    await withRollback(db, async (tx) => {
      const { owner } = await seedTrip(tx);
      await expectConstraintViolation(tx, "trips_date_range", (sp) =>
        insertTrip(sp, owner.id, { start: "2026-11-20", end: "2026-11-19" }),
      );
    });
  });

  it("allows a one-day trip (start date equals end date)", async () => {
    await withRollback(db, async (tx) => {
      const { owner } = await seedTrip(tx);
      const trip = await insertTrip(tx, owner.id, { start: "2026-11-20", end: "2026-11-20" });
      expect(trip.startDate).toBe(trip.endDate);
    });
  });

  it("rejects an unknown status override", async () => {
    await withRollback(db, async (tx) => {
      const { trip } = await seedTrip(tx);
      await expectConstraintViolation(tx, "trips_status_override_valid", (sp) =>
        sp.execute(sql`UPDATE trips SET status_override = 'ARCHIVED' WHERE id = ${trip.id}`),
      );
    });
  });

  it("rejects a trip whose base currency does not exist", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx, "owner@example.com");
      await expectConstraintViolation(tx, "trips_base_currency_code_currencies_code_fk", (sp) =>
        insertTrip(sp, owner.id),
      );
    });
  });

  describe("trip members", () => {
    it("rejects a placeholder (no user) as OWNER", async () => {
      await withRollback(db, async (tx) => {
        const { trip } = await seedTrip(tx);
        await expectConstraintViolation(tx, "trip_members_owner_has_user", (sp) =>
          sp.insert(tripMembers).values({ tripId: trip.id, displayName: "Aye", role: "OWNER" }),
        );
      });
    });

    it("rejects a member with neither a user nor a display name", async () => {
      await withRollback(db, async (tx) => {
        const { trip } = await seedTrip(tx);
        await expectConstraintViolation(tx, "trip_members_user_or_display_name", (sp) =>
          sp.insert(tripMembers).values({ tripId: trip.id, role: "MEMBER" }),
        );
      });
    });

    it("rejects the same user joining a trip twice", async () => {
      await withRollback(db, async (tx) => {
        const { owner, trip } = await seedTrip(tx);
        await tx.insert(tripMembers).values({ tripId: trip.id, userId: owner.id, role: "OWNER" });
        await expectConstraintViolation(tx, "trip_members_trip_id_user_id_key", (sp) =>
          sp.insert(tripMembers).values({ tripId: trip.id, userId: owner.id, role: "MEMBER" }),
        );
      });
    });

    it("allows several placeholders in one trip", async () => {
      await withRollback(db, async (tx) => {
        const { trip } = await seedTrip(tx);
        await tx
          .insert(tripMembers)
          .values({ tripId: trip.id, displayName: "Aye", role: "MEMBER" });
        await tx.insert(tripMembers).values({ tripId: trip.id, displayName: "Bo", role: "MEMBER" });
        const rows = await tx.select().from(tripMembers).where(eq(tripMembers.tripId, trip.id));
        expect(rows).toHaveLength(2);
      });
    });

    it("rejects an unknown membership status", async () => {
      await withRollback(db, async (tx) => {
        const { trip } = await seedTrip(tx);
        await expectConstraintViolation(tx, "trip_members_status_valid", (sp) =>
          sp.execute(
            sql`INSERT INTO trip_members (trip_id, display_name, role, status) VALUES (${trip.id}, 'Aye', 'MEMBER', 'INVITED')`,
          ),
        );
      });
    });

    it("keeps created_at strictly increasing in insert order within one transaction (D4 ordering)", async () => {
      await withRollback(db, async (tx) => {
        const { owner, trip } = await seedTrip(tx);
        // Owner + two placeholders, as M1 trip creation will insert them: one transaction,
        // separate statements.
        const [first] = await tx
          .insert(tripMembers)
          .values({ tripId: trip.id, userId: owner.id, role: "OWNER" })
          .returning();
        const [second] = await tx
          .insert(tripMembers)
          .values({ tripId: trip.id, displayName: "Aye", role: "MEMBER" })
          .returning();
        const [third] = await tx
          .insert(tripMembers)
          .values({ tripId: trip.id, displayName: "Bo", role: "MEMBER" })
          .returning();

        // Compared in PostgreSQL at full microsecond precision; JS Dates would truncate
        // to milliseconds and could hide (or invent) a tie.
        const result = await tx.execute(sql`
          SELECT (a.created_at < b.created_at AND b.created_at < c.created_at) AS strictly_increasing
          FROM trip_members a, trip_members b, trip_members c
          WHERE a.id = ${first!.id} AND b.id = ${second!.id} AND c.id = ${third!.id}
        `);
        expect(result.rows).toEqual([{ strictly_increasing: true }]);
      });
    });
  });

  describe("users", () => {
    it("rejects an email that is not stored in lowercase", async () => {
      await withRollback(db, async (tx) => {
        await expectConstraintViolation(tx, "users_email_lowercase", (sp) =>
          insertUser(sp, "Mixed.Case@Example.com"),
        );
      });
    });

    it("rejects a duplicate email", async () => {
      await withRollback(db, async (tx) => {
        await insertUser(tx, "same@example.com");
        await expectConstraintViolation(tx, "users_email_key", (sp) =>
          insertUser(sp, "same@example.com"),
        );
      });
    });

    it("refuses to delete a user who created a trip (no cascading history loss)", async () => {
      await withRollback(db, async (tx) => {
        const { owner } = await seedTrip(tx);
        await expectConstraintViolation(tx, "trips_created_by_users_id_fk", (sp) =>
          sp.delete(users).where(eq(users.id, owner.id)),
        );
      });
    });
  });
});
