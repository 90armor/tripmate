import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/modules/trips/components/coming-soon";
import { loadTripPage } from "@/modules/trips/load-workspace";

export const metadata: Metadata = { title: "Add to trip" };

/** Not built yet: intentional empty state (ROADMAP D17). */
export default async function AddPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await loadTripPage(tripId, "/add");
  return (
    <ComingSoon
      icon={Plus}
      title="Add to trip"
      description="Quick add for places, activities and expenses will live here."
    ></ComingSoon>
  );
}
