import { Sun } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/modules/trips/components/coming-soon";
import { loadTripPage } from "@/modules/trips/load-workspace";
import { TRIP_STATUS_LABELS } from "@/modules/trips/status-label";
import { tripHeadline } from "@/modules/trips/trip-headline";

export const metadata: Metadata = { title: "Today" };

/** Not built yet: intentional empty state (ROADMAP D17). */
export default async function TodayPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip } = await loadTripPage(tripId, "/today");
  return (
    <ComingSoon
      icon={Sun}
      title="Today"
      description="Your day at a glance — the next activity, bookings, directions and quick expenses — will appear here once the itinerary is set up."
    >
      {/* Lifecycle-aware even before the Today module exists (IA §8–9). */}
      <section
        aria-label="Trip status"
        className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 sm:p-5"
      >
        <p className="text-small font-semibold tracking-wide text-fg-secondary uppercase">
          {TRIP_STATUS_LABELS[trip.status]}
        </p>
        <p className="text-h2 font-semibold">{tripHeadline(trip)}</p>
      </section>
    </ComingSoon>
  );
}
