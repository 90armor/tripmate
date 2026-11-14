import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/shared/app-header";
import { buttonClassName } from "@/components/ui/button";
import { getDb } from "@/db";
import { groupTripsForList } from "@/domain/trips/trip-list";
import { requireUser } from "@/modules/auth/session";
import { TripCard } from "@/modules/trips/components/trip-card";
import { listMyTrips, type TripSummary } from "@/modules/trips/queries/list-my-trips";

export const metadata: Metadata = { title: "My Trips" };

export default async function MyTripsPage() {
  const user = await requireUser("/trips");
  const trips = await listMyTrips(getDb(), user, new Date());
  const groups = groupTripsForList(trips);
  const hasActiveTrips =
    groups.current.length + groups.upcoming.length + groups.completed.length > 0;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-5 md:px-6 md:py-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 font-semibold tracking-tight">My Trips</h1>
            <p className="text-body text-fg-secondary">Signed in as {user.displayName}.</p>
          </div>
          {hasActiveTrips ? (
            <Link href="/trips/new" className={buttonClassName({ element: "link" })}>
              <Plus aria-hidden className="size-4" />
              New trip
            </Link>
          ) : null}
        </header>

        {hasActiveTrips ? (
          <>
            <TripGroup id="current" title="Current" trips={groups.current} />
            <TripGroup id="upcoming" title="Upcoming" trips={groups.upcoming} />
            <TripGroup id="completed" title="Completed" trips={groups.completed} />
          </>
        ) : (
          <NoTripsYet />
        )}

        {groups.archived.length > 0 ? (
          // Collapsed by default (ROADMAP D16); <details> needs no client JS and is
          // keyboard and screen-reader accessible.
          <details className="group flex flex-col gap-3">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md text-h3 font-semibold text-fg-secondary">
              Archived ({groups.archived.length})
            </summary>
            <ul className="mt-3 flex flex-col gap-3">
              {groups.archived.map((trip) => (
                <li key={trip.id}>
                  <TripCard trip={trip} />
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </main>
    </>
  );
}

function TripGroup({ id, title, trips }: { id: string; title: string; trips: TripSummary[] }) {
  if (trips.length === 0) return null;
  const headingId = `trips-${id}-heading`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className="text-small font-semibold tracking-wide text-fg-secondary uppercase"
      >
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {trips.map((trip) => (
          <li key={trip.id}>
            <TripCard trip={trip} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** First-time empty state (USER_FLOWS §4, DESIGN_SYSTEM §51): teach through action. */
function NoTripsYet() {
  return (
    <section
      aria-labelledby="no-trips-heading"
      className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-5"
    >
      <h2 id="no-trips-heading" className="text-h2 font-semibold">
        No trips yet
      </h2>
      <p className="text-body-lg text-fg-secondary">
        Create a trip to keep your plans, places, and shared costs in one place.
      </p>
      <Link href="/trips/new" className={buttonClassName({ element: "link", size: "large" })}>
        <Plus aria-hidden className="size-5" />
        Create a trip
      </Link>
    </section>
  );
}
