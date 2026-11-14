import { addDays, isValidDateString, type DateString } from "./dates";

/** Canonical lifecycle statuses (AGENT_RULES §19). Archiving is `archived_at`, not a status. */
export const TRIP_STATUSES = ["PLANNING", "UPCOMING", "TRAVELING", "COMPLETED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

/** A trip is UPCOMING from this many days before its start date (ROADMAP D12). */
export const UPCOMING_WINDOW_DAYS = 14;

/**
 * Lifecycle status derived from the trip dates (ROADMAP D7, D12; DATABASE §11):
 *
 *   today > end_date                          → COMPLETED
 *   start_date <= today <= end_date           → TRAVELING
 *   start_date − 14 days <= today < start_date → UPCOMING
 *   today < start_date − 14 days              → PLANNING
 *
 * `today` must already be the current date in the trip timezone (see
 * todayInTimezone). Valid `YYYY-MM-DD` strings compare correctly as text.
 */
export function deriveTripStatus(
  startDate: DateString,
  endDate: DateString,
  today: DateString,
): TripStatus {
  for (const value of [startDate, endDate, today]) {
    if (!isValidDateString(value)) throw new RangeError(`Invalid calendar date: "${value}"`);
  }
  if (endDate < startDate) throw new RangeError("Trip end date is before its start date");

  if (today > endDate) return "COMPLETED";
  if (today >= startDate) return "TRAVELING";
  if (today >= addDays(startDate, -UPCOMING_WINDOW_DAYS)) return "UPCOMING";
  return "PLANNING";
}

/**
 * The status the product uses: a manual override wins; clearing it (null)
 * returns the trip to its derived status, so nobody is trapped by a wrong
 * automatic transition (FEATURES §6).
 */
export function effectiveTripStatus(derived: TripStatus, override: TripStatus | null): TripStatus {
  return override ?? derived;
}
