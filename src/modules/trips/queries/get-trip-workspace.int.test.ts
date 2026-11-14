import { afterAll, describe, expect, it } from "vitest";
import { NotFoundError } from "@/lib/errors";
import { insertMember, insertTrip, insertUser } from "@/test/integration/fixtures";
import { createTestDb, withRollback } from "@/test/integration/test-database";
import { getTripWorkspace } from "./get-trip-workspace";

const { db, pool } = createTestDb();
afterAll(() => pool.end());

describe("getTripWorkspace (Slice 1.4)", () => {
  it("returns Overview data with status and day count in the trip timezone", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      const trip = await insertTrip(tx, owner.id, {
        startDate: "2026-11-15",
        endDate: "2026-11-21",
        timezone: "Asia/Tokyo",
        destination: "Tokyo, Japan",
      });
      await insertMember(tx, trip.id, { displayName: "Aye" });

      // 22:30 UTC on Nov 16 is already Nov 17 (day 3) in Tokyo.
      const workspace = await getTripWorkspace(
        tx,
        owner,
        trip.id,
        new Date("2026-11-16T22:30:00Z"),
      );

      expect(workspace).toMatchObject({
        id: trip.id,
        destination: "Tokyo, Japan",
        baseCurrency: { code: "XTS", name: "Test currency" },
        status: "TRAVELING",
        derivedStatus: "TRAVELING",
        statusOverride: null,
        archived: false,
        dayCount: 7,
        today: "2026-11-17",
        daysUntilStart: -2,
        travelerCount: 2,
        role: "OWNER",
      });
    });
  });

  it("goes through the access guard: a non-member gets NotFoundError", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      const trip = await insertTrip(tx, owner.id);
      const stranger = await insertUser(tx);
      await expect(getTripWorkspace(tx, stranger, trip.id, new Date())).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
