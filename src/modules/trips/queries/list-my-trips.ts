import { and, eq, sql } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { tripDestinations, tripMembers, trips } from "@/db/schema";
import type { DateString } from "@/domain/trips/dates";
import { todayInTimezone } from "@/domain/trips/dates";
import { deriveTripStatus, effectiveTripStatus, type TripStatus } from "@/domain/trips/status";
import type { AuthenticatedUser } from "@/lib/auth/types";

export type TripSummary = {
  readonly id: string;
  readonly name: string;
  readonly destination: string | null;
  readonly startDate: DateString;
  readonly endDate: DateString;
  readonly status: TripStatus;
  readonly archived: boolean;
  readonly travelerCount: number;
};

/**
 * Trips for My Trips (CURRENT_TASK §4.2): only trips where the user has an
 * ACTIVE membership. One query — primary destination (sort_order 0) and the
 * ACTIVE traveler count come back with each trip, no N+1.
 *
 * Placeholder members (user_id NULL) never match `user_id = $user`, so they
 * never surface a trip to anyone.
 *
 * Status is the effective status (override ?? derived) with "today" taken in
 * each trip's own timezone.
 */
export async function listMyTrips(
  db: DbExecutor,
  user: AuthenticatedUser,
  now: Date,
): Promise<TripSummary[]> {
  const rows = await db
    .select({
      id: trips.id,
      name: trips.name,
      startDate: trips.startDate,
      endDate: trips.endDate,
      timezone: trips.timezone,
      statusOverride: trips.statusOverride,
      archivedAt: trips.archivedAt,
      destination: tripDestinations.name,
      // Travelers include placeholder members; LEFT/REMOVED are not counted.
      travelerCount: sql<number>`(
        select count(*) from trip_members as traveler
        where traveler.trip_id = ${trips.id} and traveler.status = 'ACTIVE'
      )`.mapWith(Number),
    })
    .from(tripMembers)
    .innerJoin(trips, eq(trips.id, tripMembers.tripId))
    .leftJoin(
      tripDestinations,
      and(eq(tripDestinations.tripId, trips.id), eq(tripDestinations.sortOrder, 0)),
    )
    .where(and(eq(tripMembers.userId, user.id), eq(tripMembers.status, "ACTIVE")));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    destination: row.destination,
    startDate: row.startDate,
    endDate: row.endDate,
    status: effectiveTripStatus(
      deriveTripStatus(row.startDate, row.endDate, todayInTimezone(now, row.timezone)),
      row.statusOverride,
    ),
    archived: row.archivedAt !== null,
    travelerCount: row.travelerCount,
  }));
}
