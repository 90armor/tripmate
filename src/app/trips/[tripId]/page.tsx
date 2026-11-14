import { Archive, ChevronRight, ClipboardCheck, Settings, Ticket, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDateRange } from "@/lib/format-date";
import { loadTripPage } from "@/modules/trips/load-workspace";
import { TRIP_STATUS_LABELS, travelerCountLabel } from "@/modules/trips/status-label";
import { tripHeadline } from "@/modules/trips/trip-headline";

export const metadata: Metadata = { title: "Trip" };

const SECTIONS = [
  { href: "/members", label: "Members", icon: Users },
  { href: "/bookings", label: "Bookings", icon: Ticket },
  { href: "/checklist", label: "Checklist", icon: ClipboardCheck },
  { href: "/settings", label: "Trip settings", icon: Settings },
] as const;

/**
 * Trip Overview (IA §23) — the trip's home in M1 and the "Trip" tab. Answers
 * "what is this trip?" with what exists in M1; lifecycle shows through the
 * status and headline (CURRENT_TASK §4.4).
 */
export default async function TripOverviewPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { trip } = await loadTripPage(tripId);

  return (
    <div className="flex flex-col gap-6">
      {trip.archived ? (
        <p className="flex items-start gap-2 rounded-md border border-border-strong bg-surface p-3 text-body text-fg-secondary">
          <Archive aria-hidden className="mt-0.5 size-4 shrink-0" />
          This trip is archived. It’s kept for reference and listed under Archived in My Trips.
        </p>
      ) : null}

      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-semibold tracking-tight break-words">{trip.name}</h1>
        {trip.destination ? (
          <p className="text-body-lg break-words text-fg-secondary">{trip.destination}</p>
        ) : null}
      </header>

      <section
        aria-labelledby="trip-status"
        className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 sm:p-5"
      >
        <h2
          id="trip-status"
          className="text-small font-semibold tracking-wide text-fg-secondary uppercase"
        >
          {TRIP_STATUS_LABELS[trip.status]}
          {trip.statusOverride ? (
            <span className="font-normal normal-case"> (set manually)</span>
          ) : null}
        </h2>
        <p className="text-h2 font-semibold">{tripHeadline(trip)}</p>
        <p className="text-body text-fg-secondary">
          {formatDateRange(trip.startDate, trip.endDate)} · {trip.dayCount}{" "}
          {trip.dayCount === 1 ? "day" : "days"}
        </p>
      </section>

      <dl className="grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3 sm:p-5">
        <div className="flex flex-col gap-0.5">
          <dt className="text-small font-medium text-fg-secondary">Travelers</dt>
          <dd className="text-body-lg">{travelerCountLabel(trip.travelerCount)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-small font-medium text-fg-secondary">Base currency</dt>
          <dd className="text-body-lg">
            {trip.baseCurrency.code}
            {trip.baseCurrency.name ? (
              <span className="text-fg-secondary"> — {trip.baseCurrency.name}</span>
            ) : null}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-small font-medium text-fg-secondary">Timezone</dt>
          <dd className="text-body-lg break-words">{trip.timezone}</dd>
        </div>
      </dl>

      <nav aria-label="Trip sections">
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {SECTIONS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={`/trips/${trip.id}${href}`}
                className="flex min-h-12 items-center gap-3 px-4 text-body-lg hover:bg-background"
              >
                <Icon aria-hidden className="size-5 text-fg-secondary" />
                <span className="flex-1">{label}</span>
                <ChevronRight aria-hidden className="size-5 text-fg-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
