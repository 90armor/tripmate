import { and, eq } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { tripMembers, trips } from "@/db/schema";
import type { MemberRole } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { AuthorizationError, NotFoundError, TripArchivedError } from "@/lib/errors";

/*
 * Trip access guard (CURRENT_TASK §4.6, AGENT_RULES §10, ARCHITECTURE §29).
 * The ONLY place trip membership is checked: every trip-scoped read and write
 * goes through these functions. M2 Slice 2.1 extends this file; do not add
 * membership queries elsewhere.
 *
 *   authenticated user → ACTIVE membership → role → (entity belongs to trip)
 *
 * Existence is never leaked: a missing trip, a malformed id, no membership, a
 * LEFT or REMOVED membership all produce the same NotFoundError. Placeholder
 * members (user_id NULL) can never match `user_id = $user`, so they never grant
 * access to anyone.
 *
 * Writes pass `{ forWrite: true }`: archived trips are read-only (ROADMAP D22),
 * so every write to one fails with TripArchivedError. The only exception is the
 * OWNER's unarchive, which deliberately does not ask for write access. Later
 * modules (places, itinerary, expenses…) inherit the rule by using forWrite.
 */

export type TripAccessOptions = {
  /**
   * The caller will modify the trip or its data. Rejects archived trips and,
   * inside a transaction, locks the trip row (FOR UPDATE) until commit, so the
   * trip cannot be archived between this check and the write.
   */
  readonly forWrite?: boolean;
};

export type Trip = typeof trips.$inferSelect;

export type TripAccess = {
  readonly trip: Trip;
  readonly membership: { readonly id: string; readonly role: MemberRole };
};

// Any well-formed UUID. Checked before querying: PostgreSQL would reject a
// malformed value with an error instead of "no row".
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TRIP_NOT_FOUND = "Trip not found.";

/** Trip and the caller's ACTIVE membership, or NotFoundError. */
export async function requireActiveTripMember(
  db: DbExecutor,
  user: AuthenticatedUser,
  tripId: string,
  options: TripAccessOptions = {},
): Promise<TripAccess> {
  const access = await findActiveMembership(db, user, tripId, options);
  if (options.forWrite) assertWritable(access);
  return access;
}

async function findActiveMembership(
  db: DbExecutor,
  user: AuthenticatedUser,
  tripId: string,
  options: TripAccessOptions,
): Promise<TripAccess> {
  if (!user.id || !UUID_PATTERN.test(tripId)) throw new NotFoundError(TRIP_NOT_FOUND);

  // One query; the UNIQUE(trip_id, user_id) index serves the membership lookup.
  const query = db
    .select({ trip: trips, membershipId: tripMembers.id, role: tripMembers.role })
    .from(tripMembers)
    .innerJoin(trips, eq(trips.id, tripMembers.tripId))
    .where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.userId, user.id),
        eq(tripMembers.status, "ACTIVE"),
      ),
    );
  const [row] = options.forWrite ? await query.for("update", { of: trips }) : await query;
  if (!row) throw new NotFoundError(TRIP_NOT_FOUND);

  return { trip: row.trip, membership: { id: row.membershipId, role: row.role } };
}

function assertWritable(access: TripAccess) {
  if (access.trip.archivedAt !== null) throw new TripArchivedError();
}

/**
 * As requireActiveTripMember, and the caller must be an OWNER. A member who is
 * not an owner already knows the trip exists, so they get AuthorizationError.
 * The role is checked before the archived check, so a MEMBER is told they lack
 * permission rather than that the trip is archived.
 */
export async function requireTripOwner(
  db: DbExecutor,
  user: AuthenticatedUser,
  tripId: string,
  options: TripAccessOptions = {},
): Promise<TripAccess> {
  const access = await findActiveMembership(db, user, tripId, options);
  if (access.membership.role !== "OWNER") {
    throw new AuthorizationError("Only the trip owner can do that.");
  }
  if (options.forWrite) assertWritable(access);
  return access;
}
