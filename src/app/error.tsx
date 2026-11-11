"use client";

import { Button } from "@/components/ui/button";

// Raw error details are never shown to users (AGENT_RULES §55).
export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-8 sm:px-5 md:px-6 md:py-12">
      <h1 className="text-h2 font-semibold">Something went wrong</h1>
      <p className="text-body text-fg-secondary">
        This page couldn’t be loaded. Your data has not been changed. Please try again.
      </p>
      <Button variant="secondary" className="self-start" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
