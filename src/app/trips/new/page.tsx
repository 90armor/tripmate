import type { Metadata } from "next";
import { AppHeader } from "@/components/shared/app-header";
import { Card } from "@/components/ui/card";
import { getDb } from "@/db";
import { listTimeZones } from "@/lib/timezones";
import { requireUser } from "@/modules/auth/session";
import { listActiveCurrencies } from "@/modules/currencies/list-active-currencies";
import { CreateTripForm } from "@/modules/trips/components/create-trip-form";

export const metadata: Metadata = { title: "New trip" };

export default async function NewTripPage() {
  await requireUser("/trips/new");
  const currencies = await listActiveCurrencies(getDb());
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-5 md:px-6 md:py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-h1 font-semibold tracking-tight">Create a trip</h1>
          <p className="text-body-lg text-fg-secondary">
            Start with the basics. You can change them later in Trip Settings.
          </p>
        </header>
        <Card>
          {/* The server's list is the one it validates against, so pass it down. */}
          <CreateTripForm timezones={listTimeZones()} currencies={currencies} />
        </Card>
      </main>
    </>
  );
}
