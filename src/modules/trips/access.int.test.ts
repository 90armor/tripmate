import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { Transaction } from "@/db/client";
import { AuthorizationError, NotFoundError } from "@/lib/errors";
import { insertMember, insertTrip, insertUser } from "@/test/integration/fixtures";
import { createTestDb, withRollback } from "@/test/integration/test-database";
import { requireActiveTripMember, requireTripOwner } from "./access";

const { db, pool } = createTestDb();
afterAll(() => pool.end());

/** The error a guard call throws, or undefined when it allows access. */
async function errorOf(call: Promise<unknown>): Promise<unknown> {
  return call.then(
    () => undefined,
    (error: unknown) => error,
  );
}

async function expectNotFound(call: Promise<unknown>) {
  const error = await errorOf(call);
  expect(error).toBeInstanceOf(NotFoundError);
  // Same message for every denial, so responses cannot tell the cases apart.
  expect((error as Error).message).toBe("Trip not found.");
}

async function ownerAndTrip(tx: Transaction) {
  const owner = await insertUser(tx, "Owner");
  const trip = await insertTrip(tx, owner.id);
  return { owner, trip };
}

describe("requireActiveTripMember (CURRENT_TASK §4.6)", () => {
  it("allows the OWNER and returns the trip and membership", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await ownerAndTrip(tx);
      const access = await requireActiveTripMember(tx, owner, trip.id);
      expect(access.trip.id).toBe(trip.id);
      expect(access.trip.name).toBe(trip.name);
      expect(access.membership.role).toBe("OWNER");
    });
  });

  it("allows an ACTIVE MEMBER", async () => {
    await withRollback(db, async (tx) => {
      const { trip } = await ownerAndTrip(tx);
      const member = await insertUser(tx, "Member");
      const row = await insertMember(tx, trip.id, { userId: member.id, role: "MEMBER" });
      const access = await requireActiveTripMember(tx, member, trip.id);
      expect(access.membership).toEqual({ id: row.id, role: "MEMBER" });
    });
  });

  it("still allows members to open an archived trip", async () => {
    await withRollback(db, async (tx) => {
      const owner = await insertUser(tx);
      const trip = await insertTrip(tx, owner.id, { archivedAt: new Date() });
      await expect(requireActiveTripMember(tx, owner, trip.id)).resolves.toBeDefined();
    });
  });

  it("denies a user with no membership (User A cannot open User B's trip)", async () => {
    await withRollback(db, async (tx) => {
      const { trip: bobsTrip } = await ownerAndTrip(tx);
      const alice = await insertUser(tx, "Alice");
      await insertTrip(tx, alice.id);
      await expectNotFound(requireActiveTripMember(tx, alice, bobsTrip.id));
    });
  });

  it.each(["LEFT", "REMOVED"] as const)("denies a %s membership", async (status) => {
    await withRollback(db, async (tx) => {
      const { trip } = await ownerAndTrip(tx);
      const former = await insertUser(tx, "Former");
      await insertMember(tx, trip.id, { userId: former.id, status });
      await expectNotFound(requireActiveTripMember(tx, former, trip.id));
    });
  });

  it("never lets a placeholder grant access", async () => {
    await withRollback(db, async (tx) => {
      const { trip } = await ownerAndTrip(tx);
      await insertMember(tx, trip.id, { displayName: "Aye (no account)" });
      const stranger = await insertUser(tx, "Stranger");
      await expectNotFound(requireActiveTripMember(tx, stranger, trip.id));
      // A caller without a user id is never matched against placeholder rows.
      await expectNotFound(requireActiveTripMember(tx, { id: "" }, trip.id));
    });
  });

  it("treats a missing trip exactly like someone else's trip", async () => {
    await withRollback(db, async (tx) => {
      const { trip } = await ownerAndTrip(tx);
      const stranger = await insertUser(tx);
      const missing = await errorOf(requireActiveTripMember(tx, stranger, randomUUID()));
      const forbidden = await errorOf(requireActiveTripMember(tx, stranger, trip.id));
      expect(missing).toBeInstanceOf(NotFoundError);
      expect(forbidden).toBeInstanceOf(NotFoundError);
      expect((missing as Error).message).toBe((forbidden as Error).message);
    });
  });

  it.each(["not-a-uuid", "", "' or 1=1 --", `${randomUUID()}x`, "../settings"])(
    "rejects a malformed trip id %j as not found, without a database error",
    async (tripId) => {
      await withRollback(db, async (tx) => {
        const owner = await insertUser(tx);
        await expectNotFound(requireActiveTripMember(tx, owner, tripId));
      });
    },
  );

  it("accepts an upper-case UUID for the right trip", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await ownerAndTrip(tx);
      const access = await requireActiveTripMember(tx, owner, trip.id.toUpperCase());
      expect(access.trip.id).toBe(trip.id);
    });
  });
});

describe("requireTripOwner", () => {
  it("allows the OWNER", async () => {
    await withRollback(db, async (tx) => {
      const { owner, trip } = await ownerAndTrip(tx);
      const access = await requireTripOwner(tx, owner, trip.id);
      expect(access.membership.role).toBe("OWNER");
    });
  });

  it("rejects an ACTIVE MEMBER with AuthorizationError", async () => {
    await withRollback(db, async (tx) => {
      const { trip } = await ownerAndTrip(tx);
      const member = await insertUser(tx, "Member");
      await insertMember(tx, trip.id, { userId: member.id, role: "MEMBER" });
      const error = await errorOf(requireTripOwner(tx, member, trip.id));
      expect(error).toBeInstanceOf(AuthorizationError);
    });
  });

  it("gives non-members and former owners NotFoundError, not AuthorizationError", async () => {
    await withRollback(db, async (tx) => {
      const { trip } = await ownerAndTrip(tx);
      const stranger = await insertUser(tx);
      await expectNotFound(requireTripOwner(tx, stranger, trip.id));

      const formerOwner = await insertUser(tx, "Former owner");
      await insertMember(tx, trip.id, { userId: formerOwner.id, role: "OWNER", status: "LEFT" });
      await expectNotFound(requireTripOwner(tx, formerOwner, trip.id));
    });
  });
});
