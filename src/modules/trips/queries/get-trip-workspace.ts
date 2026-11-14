import { and, eq, sql } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { currencies, tripDestinations } from "@/db/schema";
import type { MemberRole } from "@/db/schema";
import { daysBetween, todayInTimezone, tripDayCount, type DateString } from "@/domain/trips/dates";
import { deriveTripStatus, effectiveTripStatus, type TripStatus } from "@/domain/trips/status";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { requireActiveTripMember } from "../access";

export type TripWorkspace = {
  readonly id: string;
  readonly name: string;
  readonly destination: string | null;
  readonly startDate: DateString;
  readonly endDate: DateString;
  readonly timezone: string;
  readonly baseCurrency: { readonly code: string; readonly name: string };
  readonly status: TripStatus;
  readonly derivedStatus: TripStatus;
  readonly statusOverride: TripStatus | null;
  readonly archived: boolean;
  readonly dayCount: number;
  /** "Today" in the trip timezone (FEATURES §41). */
  readonly today: DateString;
  /** Days from today until the start date (negative once started). */
  readonly daysUntilStart: number;
  readonly travelerCount: number;
  readonly role: MemberRole;
};

/**
 * Everything the Trip Workspace shell and Overview show in M1. Access goes
 * through the trip guard first, so a non-member gets NotFoundError before any
 * trip data is read.
 */
export async function getTripWorkspace(
  db: DbExecutor,
  user: AuthenticatedUser,
  tripId: string,
  now: Date,
): Promise<TripWorkspace> {
  const { trip, membership } = await requireActiveTripMember(db, user, tripId);

  const [details] = await db
    .select({
      destination: tripDestinations.name,
      currencyName: currencies.name,
      travelerCount: sql<number>`(
        select count(*) from trip_members as traveler
        where traveler.trip_id = ${trip.id} and traveler.status = 'ACTIVE'
      )`.mapWith(Number),
    })
    .from(currencies)
    .leftJoin(
      tripDestinations,
      and(eq(tripDestinations.tripId, trip.id), eq(tripDestinations.sortOrder, 0)),
    )
    .where(eq(currencies.code, trip.baseCurrencyCode));

  const today = todayInTimezone(now, trip.timezone);
  const derivedStatus = deriveTripStatus(trip.startDate, trip.endDate, today);

  return {
    id: trip.id,
    name: trip.name,
    destination: details?.destination ?? null,
    startDate: trip.startDate,
    endDate: trip.endDate,
    timezone: trip.timezone,
    baseCurrency: { code: trip.baseCurrencyCode, name: details?.currencyName ?? "" },
    status: effectiveTripStatus(derivedStatus, trip.statusOverride),
    derivedStatus,
    statusOverride: trip.statusOverride,
    archived: trip.archivedAt !== null,
    dayCount: tripDayCount(trip.startDate, trip.endDate),
    today,
    daysUntilStart: daysBetween(today, trip.startDate),
    travelerCount: details?.travelerCount ?? 1,
    role: membership.role,
  };
}
