import type { DateString } from "@/domain/trips/dates";
import { daysBetween } from "@/domain/trips/dates";
import type { TripStatus } from "@/domain/trips/status";
import { formatDateRange } from "@/lib/format-date";

/**
 * Lifecycle-aware one-liner for the trip header, Overview and Today
 * (IA §8–9, §33): "Starts in 18 days", "Day 3 of 7", "Ended Nov 21, 2026".
 *
 * Uses the effective status, so a manual override is respected; counts come
 * from the dates with "today" in the trip timezone.
 */
export function tripHeadline(trip: {
  status: TripStatus;
  startDate: DateString;
  endDate: DateString;
  today: DateString;
  dayCount: number;
}): string {
  const untilStart = daysBetween(trip.today, trip.startDate);
  switch (trip.status) {
    case "PLANNING":
    case "UPCOMING":
      if (untilStart > 1) return `Starts in ${untilStart} days`;
      if (untilStart === 1) return "Starts tomorrow";
      // Override says not started yet, but the dates have arrived.
      return `Starts ${formatDateRange(trip.startDate, trip.startDate)}`;
    case "TRAVELING": {
      const day = daysBetween(trip.startDate, trip.today) + 1;
      // An override can mark a trip TRAVELING outside its dates; fall back to the range.
      if (day < 1 || day > trip.dayCount) return formatDateRange(trip.startDate, trip.endDate);
      return `Day ${day} of ${trip.dayCount}`;
    }
    case "COMPLETED":
      // Marked completed early by an override: don't claim a future end date.
      if (trip.today <= trip.endDate) return "Completed";
      return `Ended ${formatDateRange(trip.endDate, trip.endDate)}`;
  }
}
