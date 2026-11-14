import type { Metadata } from "next";
import { AppHeader } from "@/components/shared/app-header";
import { requireUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "My Trips" };

// Slice 1.1 shell: the trip list, grouping and empty state arrive in Slice 1.2.
export default async function MyTripsPage() {
  const user = await requireUser("/trips");
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 sm:px-5 md:px-6 md:py-10">
        <h1 className="text-h1 font-semibold tracking-tight">My Trips</h1>
        <p className="text-body-lg text-fg-secondary">Signed in as {user.displayName}.</p>
      </main>
    </>
  );
}
