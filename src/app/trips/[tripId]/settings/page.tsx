import { Archive, Lock } from "lucide-react";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getDb } from "@/db";
import { formatDateRange } from "@/lib/format-date";
import { listTimeZones } from "@/lib/timezones";
import { listActiveCurrencies } from "@/modules/currencies/list-active-currencies";
import { setTripArchivedAction, updateTripSettingsAction } from "@/modules/trips/actions";
import { ArchiveTripButton, UnarchiveTripForm } from "@/modules/trips/components/archive-trip";
import { TripSettingsForm } from "@/modules/trips/components/trip-settings-form";
import { loadTripPage } from "@/modules/trips/load-workspace";
import type { TripWorkspace } from "@/modules/trips/queries/get-trip-workspace";
import { TRIP_STATUS_LABELS } from "@/modules/trips/status-label";

export const metadata: Metadata = { title: "Trip settings" };

/**
 * Trip Settings (CURRENT_TASK §4.5, IA §28). The OWNER edits an active trip;
 * everyone else, and everyone on an archived trip (ROADMAP D22), sees a
 * read-only summary. Hiding the form is presentation only: the services enforce
 * the same rules.
 */
export default async function TripSettingsPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { trip } = await loadTripPage(tripId, "/settings");
  const isOwner = trip.role === "OWNER";
  const canEdit = isOwner && !trip.archived;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-semibold tracking-tight">Trip settings</h1>
        <p className="text-body-lg text-fg-secondary">The basics everyone on the trip sees.</p>
      </header>

      {trip.archived ? (
        <section
          aria-labelledby="archived-heading"
          className="flex flex-col gap-3 rounded-lg border border-border-strong bg-surface p-4 sm:p-5"
        >
          <h2 id="archived-heading" className="flex items-center gap-2 text-h3 font-semibold">
            <Archive aria-hidden className="size-5 shrink-0" />
            This trip is archived
          </h2>
          <p className="text-body text-fg-secondary">
            {isOwner
              ? "It’s read-only and listed under Archived in My Trips. Unarchive it to make changes."
              : "It’s read-only. Only the trip owner can unarchive it."}
          </p>
          {isOwner ? (
            <UnarchiveTripForm action={setTripArchivedAction.bind(null, trip.id, false)} />
          ) : null}
        </section>
      ) : null}

      {canEdit ? (
        <Card aria-label="Trip details">
          <TripSettingsForm
            action={updateTripSettingsAction.bind(null, trip.id)}
            saved={{
              name: trip.name,
              destination: trip.destination ?? "",
              startDate: trip.startDate,
              endDate: trip.endDate,
              timezone: trip.timezone,
              baseCurrency: trip.baseCurrency.code,
              statusOverride: trip.statusOverride ?? "",
            }}
            automaticStatus={TRIP_STATUS_LABELS[trip.derivedStatus]}
            timezones={listTimeZones()}
            currencies={await currencyOptions(trip)}
          />
        </Card>
      ) : (
        <TripSettingsSummary trip={trip} />
      )}

      {!isOwner && !trip.archived ? (
        <p className="flex items-start gap-2 text-body text-fg-secondary">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          Only the trip owner can change these settings.
        </p>
      ) : null}

      {canEdit ? (
        // Destructive actions belong at the bottom (IA §28).
        <section
          aria-labelledby="archive-heading"
          className="flex flex-col items-start gap-3 rounded-lg border border-danger bg-surface p-4 sm:p-5"
        >
          <h2 id="archive-heading" className="text-h3 font-semibold">
            Archive trip
          </h2>
          <p className="text-body text-fg-secondary">
            Moves the trip to Archived in My Trips and makes it read-only for everyone. Nothing is
            deleted, and you can unarchive it at any time.
          </p>
          <ArchiveTripButton
            action={setTripArchivedAction.bind(null, trip.id, true)}
            tripName={trip.name}
          />
        </section>
      ) : null}
    </div>
  );
}

/**
 * Active currencies, plus the trip's own if it has since been deactivated:
 * keeping the current currency is always allowed (updateTripSettings).
 */
async function currencyOptions(trip: TripWorkspace) {
  const active = await listActiveCurrencies(getDb());
  if (active.some((currency) => currency.code === trip.baseCurrency.code)) return active;
  return [{ code: trip.baseCurrency.code, name: trip.baseCurrency.name }, ...active];
}

function TripSettingsSummary({ trip }: { trip: TripWorkspace }) {
  const rows = [
    { term: "Trip name", value: trip.name },
    { term: "Destination", value: trip.destination ?? "—" },
    { term: "Dates", value: formatDateRange(trip.startDate, trip.endDate) },
    { term: "Timezone", value: trip.timezone },
    {
      term: "Base currency",
      value: trip.baseCurrency.name
        ? `${trip.baseCurrency.code} — ${trip.baseCurrency.name}`
        : trip.baseCurrency.code,
    },
    {
      term: "Trip status",
      value: trip.statusOverride
        ? `${TRIP_STATUS_LABELS[trip.statusOverride]} (set manually)`
        : `Automatic (${TRIP_STATUS_LABELS[trip.derivedStatus]})`,
    },
  ];
  return (
    <Card aria-label="Trip details">
      <dl className="flex flex-col gap-4">
        {rows.map(({ term, value }) => (
          <div key={term} className="flex flex-col gap-0.5">
            <dt className="text-small font-medium text-fg-secondary">{term}</dt>
            <dd className="text-body-lg break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
