import { Ticket } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/modules/trips/components/coming-soon";
import { loadTripPage } from "@/modules/trips/load-workspace";

export const metadata: Metadata = { title: "Bookings" };

/** Not built yet: intentional empty state (ROADMAP D17). */
export default async function BookingsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await loadTripPage(tripId, "/bookings");
  return (
    <ComingSoon
      icon={Ticket}
      title="Bookings"
      description="Flights, hotels, tickets and reservation details will be kept together here."
    ></ComingSoon>
  );
}
