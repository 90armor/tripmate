import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/modules/trips/components/coming-soon";
import { loadTripPage } from "@/modules/trips/load-workspace";

export const metadata: Metadata = { title: "Trip settings" };

/** Not built yet: intentional empty state (ROADMAP D17). */
export default async function SettingsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await loadTripPage(tripId, "/settings");
  return (
    <ComingSoon
      icon={Settings}
      title="Trip settings"
      description="Editing the trip name, destination, dates, timezone and currency, and archiving the trip, will live here."
    ></ComingSoon>
  );
}
