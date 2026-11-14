import { ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/modules/trips/components/coming-soon";
import { loadTripPage } from "@/modules/trips/load-workspace";

export const metadata: Metadata = { title: "Checklist" };

/** Not built yet: intentional empty state (ROADMAP D17). */
export default async function ChecklistPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await loadTripPage(tripId, "/checklist");
  return (
    <ComingSoon
      icon={ClipboardCheck}
      title="Checklist"
      description="A shared packing and to-do list for the trip will live here."
    ></ComingSoon>
  );
}
