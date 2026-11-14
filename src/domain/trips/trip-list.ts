import type { DateString } from "./dates";
import type { TripStatus } from "./status";

export type TripListEntry = {
  readonly status: TripStatus;
  readonly archived: boolean;
  readonly startDate: DateString;
  readonly endDate: DateString;
};

export type TripListGroups<T> = {
  readonly current: T[];
  readonly upcoming: T[];
  readonly completed: T[];
  readonly archived: T[];
};

/**
 * My Trips grouping (CURRENT_TASK §4.2, ROADMAP D16):
 *   Current   — TRAVELING
 *   Upcoming  — UPCOMING and PLANNING, soonest first
 *   Completed — COMPLETED, most recent first
 *   Archived  — any archived trip, whatever its status, most recent first
 *
 * `status` is the effective status (override applied).
 */
export function groupTripsForList<T extends TripListEntry>(trips: readonly T[]): TripListGroups<T> {
  const groups: TripListGroups<T> = { current: [], upcoming: [], completed: [], archived: [] };
  for (const trip of trips) {
    if (trip.archived) groups.archived.push(trip);
    else if (trip.status === "TRAVELING") groups.current.push(trip);
    else if (trip.status === "COMPLETED") groups.completed.push(trip);
    else groups.upcoming.push(trip);
  }
  // Date strings sort correctly as text; Array.prototype.sort is stable, so
  // equal dates keep their input order.
  const byStartAsc = (a: T, b: T) => compare(a.startDate, b.startDate);
  const byEndDesc = (a: T, b: T) => compare(b.endDate, a.endDate);
  groups.current.sort(byStartAsc);
  groups.upcoming.sort(byStartAsc);
  groups.completed.sort(byEndDesc);
  groups.archived.sort(byEndDesc);
  return groups;
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
