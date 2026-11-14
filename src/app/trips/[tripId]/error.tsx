"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Rendered inside the workspace shell, so navigation stays usable.
// Raw error details are never shown to users (AGENT_RULES §55).
export default function TripPageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-h2 font-semibold">Couldn’t load this page</h1>
      <p className="text-body text-fg-secondary">
        Your trip is safe — this page just didn’t load. Check your connection and try again.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/trips"
          className="inline-flex min-h-11 items-center px-2 text-body font-medium text-action underline underline-offset-4"
        >
          Back to My Trips
        </Link>
      </div>
    </div>
  );
}
