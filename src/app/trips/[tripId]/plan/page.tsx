import { Map } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/modules/trips/components/coming-soon";
import { loadTripPage } from "@/modules/trips/load-workspace";

export const metadata: Metadata = { title: "Plan" };

/** Not built yet: intentional empty state (ROADMAP D17). */
export default async function PlanPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await loadTripPage(tripId, "/plan");
  return (
    <ComingSoon
      icon={Map}
      title="Plan"
      description="Saved places and the day-by-day itinerary will live here, so everyone can plan the trip together."
    ></ComingSoon>
  );
}
