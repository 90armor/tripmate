import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDateRange } from "@/lib/format-date";
import type { TripSummary } from "../queries/list-my-trips";
import { TRIP_STATUS_LABELS, travelerCountLabel } from "../status-label";

/**
 * Trip card (DESIGN_SYSTEM §36): name, destination, dates, then status and
 * traveler count. The whole card is one link, so it is one large touch target
 * and one tab stop.
 */
export function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <article className="relative rounded-lg border border-border bg-surface transition-colors duration-(--duration-fast) hover:border-border-strong">
      <Link
        href={`/trips/${trip.id}`}
        className="flex min-h-11 items-center gap-3 rounded-lg p-4 sm:p-5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-h3 font-semibold break-words text-fg">{trip.name}</h3>
          {trip.destination ? (
            <p className="text-body break-words text-fg-secondary">{trip.destination}</p>
          ) : null}
          <p className="text-body text-fg-secondary">
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>
          <p className="text-small font-medium text-fg">
            {TRIP_STATUS_LABELS[trip.status]}
            <span className="text-fg-muted"> · {travelerCountLabel(trip.travelerCount)}</span>
          </p>
        </div>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-fg-muted" />
      </Link>
    </article>
  );
}
