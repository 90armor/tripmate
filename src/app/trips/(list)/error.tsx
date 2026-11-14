"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Raw error details are never shown to users (AGENT_RULES §55).
export default function MyTripsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-8 sm:px-5 md:px-6 md:py-12">
      <h1 className="text-h2 font-semibold">Couldn’t load your trips</h1>
      <p className="text-body text-fg-secondary">
        Your trips are safe — we just couldn’t fetch them. Check your connection and try again.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/profile"
          className="inline-flex min-h-11 items-center px-2 text-body font-medium text-action underline underline-offset-4"
        >
          Go to Profile
        </Link>
      </div>
    </main>
  );
}
