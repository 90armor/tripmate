import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/modules/trips/components/coming-soon";
import { loadTripPage } from "@/modules/trips/load-workspace";

export const metadata: Metadata = { title: "Expenses" };

/** Not built yet: intentional empty state (ROADMAP D17). */
export default async function ExpensesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await loadTripPage(tripId, "/expenses");
  return (
    <ComingSoon
      icon={Wallet}
      title="Expenses"
      description="Shared spending, who paid for what, balances, and settling up will live here."
    ></ComingSoon>
  );
}
