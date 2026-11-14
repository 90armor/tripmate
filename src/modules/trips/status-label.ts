import type { TripStatus } from "@/domain/trips/status";

/** User-facing lifecycle labels (USER_FLOWS §3). Shown as text, never colour alone. */
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  PLANNING: "Planning",
  UPCOMING: "Upcoming",
  TRAVELING: "Traveling now",
  COMPLETED: "Completed",
};

export function travelerCountLabel(count: number): string {
  return count === 1 ? "1 traveler" : `${count} travelers`;
}
