import { afterAll, describe, expect, it } from "vitest";
import { tripDestinations } from "@/db/schema";
import { insertMember, insertTrip, insertUser } from "@/test/integration/fixtures";
import { createTestDb, withRollback } from "@/test/integration/test-database";
import { listMyTrips } from "./list-my-trips";

const { db, pool } = createTestDb();
afterAll(() => pool.end());

// 2026-11-14 22:30 UTC: already Nov 15 in Tokyo, still Nov 14 in UTC.
const NOW = new Date("2026-11-14T22:30:00Z");

describe("listMyTrips (Slice 1.2)", () => {
  it("returns the user's trips with primary destination, effective status and traveler count", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      const trip = await insertTrip(tx, owner.id, {
        name: "Tokyo Autumn Trip",
        startDate: "2026-11-15",
        endDate: "2026-11-21",
        timezone: "Asia/Tokyo",
        destination: "Tokyo, Japan",
      });
      await insertMember(tx, trip.id, { displayName: "Aye (placeholder)" });
      await insertMember(tx, trip.id, { userId: (await insertUser(tx)).id, status: "LEFT" });

      const result = await listMyTrips(tx, owner, NOW);

      expect(result).toEqual([
        {
          id: trip.id,
          name: "Tokyo Autumn Trip",
          destination: "Tokyo, Japan",
          startDate: "2026-11-15",
          endDate: "2026-11-21",
          // Nov 15 in Tokyo is the start day; in UTC it would still be UPCOMING.
          status: "TRAVELING",
          archived: false,
          // Owner + placeholder; the LEFT member is not a current traveler.
          travelerCount: 2,
        },
      ]);
    });
  });

  it("uses the primary destination (sort_order 0) only", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      const trip = await insertTrip(tx, owner.id, { destination: "Tokyo, Japan" });
      await tx
        .insert(tripDestinations)
        .values({ tripId: trip.id, name: "Kyoto, Japan", sortOrder: 1 });

      const [summary] = await listMyTrips(tx, owner, NOW);
      expect(summary?.destination).toBe("Tokyo, Japan");
    });
  });

  it("never returns another user's trip", async () => {
    await withRollback(db, async (tx) => {
      const alice = await insertUser(tx, "Alice");
      const bob = await insertUser(tx, "Bob");
      await insertTrip(tx, alice.id, { name: "Alice's trip" });
      const bobsTrip = await insertTrip(tx, bob.id, { name: "Bob's trip" });

      const forAlice = await listMyTrips(tx, alice, NOW);
      expect(forAlice.map((t) => t.name)).toEqual(["Alice's trip"]);
      expect(forAlice.map((t) => t.id)).not.toContain(bobsTrip.id);
    });
  });

  it("excludes trips where the user's membership is LEFT or REMOVED", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      const user = await insertUser(tx);
      const left = await insertTrip(tx, owner.id, { name: "Left trip" });
      const removed = await insertTrip(tx, owner.id, { name: "Removed trip" });
      const active = await insertTrip(tx, owner.id, { name: "Active trip" });
      await insertMember(tx, left.id, { userId: user.id, status: "LEFT" });
      await insertMember(tx, removed.id, { userId: user.id, status: "REMOVED" });
      await insertMember(tx, active.id, { userId: user.id });

      const result = await listMyTrips(tx, user, NOW);
      expect(result.map((t) => t.name)).toEqual(["Active trip"]);
    });
  });

  it("returns nothing for a user with no memberships (placeholders never link to users)", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      const trip = await insertTrip(tx, owner.id);
      await insertMember(tx, trip.id, { displayName: "Placeholder" });
      const stranger = await insertUser(tx);

      expect(await listMyTrips(tx, stranger, NOW)).toEqual([]);
    });
  });

  it("marks archived trips and applies the status override", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      await insertTrip(tx, owner.id, {
        name: "Archived",
        archivedAt: new Date("2026-10-01T00:00:00Z"),
      });
      await insertTrip(tx, owner.id, {
        name: "Overridden",
        startDate: "2027-05-01",
        endDate: "2027-05-05",
        statusOverride: "COMPLETED",
      });

      const byName = Object.fromEntries(
        (await listMyTrips(tx, owner, NOW)).map((t) => [t.name, t]),
      );
      expect(byName["Archived"]?.archived).toBe(true);
      // Derived would be PLANNING; the override wins (D7).
      expect(byName["Overridden"]?.status).toBe("COMPLETED");
      expect(byName["Overridden"]?.archived).toBe(false);
    });
  });
});
