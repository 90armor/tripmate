import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { insertTrip, insertUser } from "@/test/integration/fixtures";
import {
  createTestDb,
  expectConstraintViolation,
  withRollback,
} from "@/test/integration/test-database";
import { tripDestinations, tripMembers, trips } from "./schema";

const { db, pool } = createTestDb();
afterAll(() => pool.end());

describe("trip_destinations (DATABASE §12, ROADMAP D11)", () => {
  it("enforces UNIQUE(trip_id, sort_order): one primary destination per trip", async () => {
    await withRollback(db, async (tx) => {
      const trip = await insertTrip(tx, (await insertUser(tx)).id); // inserts sort_order 0
      await expectConstraintViolation(tx, "trip_destinations_trip_id_sort_order_key", (sp) =>
        sp.insert(tripDestinations).values({ tripId: trip.id, name: "Osaka", sortOrder: 0 }),
      );
      // A second destination with a different sort_order is allowed later.
      await tx.insert(tripDestinations).values({ tripId: trip.id, name: "Kyoto", sortOrder: 1 });
    });
  });

  it("allows sort_order 0 in different trips", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      await insertTrip(tx, owner.id);
      await insertTrip(tx, owner.id);
      const rows = await tx.execute(
        sql`select count(*)::int as n from trip_destinations where sort_order = 0`,
      );
      expect((rows.rows[0] as { n: number }).n).toBeGreaterThanOrEqual(2);
    });
  });

  it("rejects a negative sort_order", async () => {
    await withRollback(db, async (tx) => {
      const trip = await insertTrip(tx, (await insertUser(tx)).id);
      await expectConstraintViolation(tx, "trip_destinations_sort_order_nonnegative", (sp) =>
        sp.insert(tripDestinations).values({ tripId: trip.id, name: "Nowhere", sortOrder: -1 }),
      );
    });
  });

  it("rejects out-of-range coordinates and malformed country codes", async () => {
    await withRollback(db, async (tx) => {
      const trip = await insertTrip(tx, (await insertUser(tx)).id);
      const base = { tripId: trip.id, name: "Somewhere", sortOrder: 5 };
      await expectConstraintViolation(tx, "trip_destinations_latitude_range", (sp) =>
        sp.insert(tripDestinations).values({ ...base, latitude: "90.000001" }),
      );
      await expectConstraintViolation(tx, "trip_destinations_longitude_range", (sp) =>
        sp.insert(tripDestinations).values({ ...base, longitude: "-180.000001" }),
      );
      await expectConstraintViolation(tx, "trip_destinations_country_code_format", (sp) =>
        sp.insert(tripDestinations).values({ ...base, countryCode: "jp" }),
      );
      const [ok] = await tx
        .insert(tripDestinations)
        .values({ ...base, countryCode: "JP", latitude: "35.676200", longitude: "139.650300" })
        .returning();
      // NUMERIC round-trips as an exact string, never a float.
      expect(ok?.latitude).toBe("35.676200");
    });
  });

  it("does not let a trip with destinations be deleted (ON DELETE RESTRICT)", async () => {
    await withRollback(db, async (tx) => {
      const trip = await insertTrip(tx, (await insertUser(tx)).id);
      await expectConstraintViolation(tx, "trip_destinations_trip_id_trips_id_fk", async (sp) => {
        // Remove the membership first so only the destination FK can block the delete.
        await sp.delete(tripMembers).where(eq(tripMembers.tripId, trip.id));
        await sp.delete(trips).where(eq(trips.id, trip.id));
      });
    });
  });
});
