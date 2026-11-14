import { Users } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/modules/trips/components/coming-soon";
import { loadTripPage } from "@/modules/trips/load-workspace";

export const metadata: Metadata = { title: "Members" };

/** Not built yet: intentional empty state (ROADMAP D17). */
export default async function MembersPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await loadTripPage(tripId, "/members");
  return (
    <ComingSoon
      icon={Users}
      title="Members"
      description="Everyone on the trip will be listed here, with invitations for new travelers."
    ></ComingSoon>
  );
}
