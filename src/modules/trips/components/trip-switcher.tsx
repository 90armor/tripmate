import { Check, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { cx } from "@/lib/cx";

/**
 * Desktop trip switcher (IA §30): "Tokyo Autumn ▾" opens the user's trips.
 * A <details> disclosure — keyboard and screen-reader accessible with no JS.
 */
export function TripSwitcher({
  current,
  trips,
}: {
  current: { id: string; name: string };
  trips: readonly { id: string; name: string }[];
}) {
  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-border px-3 text-body font-semibold hover:bg-background">
        <span className="truncate">{current.name}</span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
        <span className="sr-only">Switch trip</span>
      </summary>
      <div className="mt-1 flex flex-col gap-1 rounded-md border border-border bg-surface-elevated p-1 shadow-elevated">
        <p className="px-3 pt-2 pb-1 text-small font-semibold text-fg-secondary">Your trips</p>
        <ul className="flex flex-col">
          {trips.map((trip) => {
            const isCurrent = trip.id === current.id;
            return (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cx(
                    "flex min-h-11 items-center gap-2 rounded-md px-3 text-body hover:bg-background",
                    isCurrent ? "font-semibold" : "text-fg-secondary",
                  )}
                >
                  <Check aria-hidden className={cx("size-4 shrink-0", !isCurrent && "invisible")} />
                  <span className="truncate">{trip.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border pt-1">
          <Link
            href="/trips/new"
            className="flex min-h-11 items-center gap-2 rounded-md px-3 text-body font-medium text-action hover:bg-background"
          >
            <Plus aria-hidden className="size-4" />
            New trip
          </Link>
          <Link
            href="/trips"
            className="flex min-h-11 items-center rounded-md px-3 pl-9 text-body font-medium text-fg-secondary hover:bg-background"
          >
            View all trips
          </Link>
        </div>
      </div>
    </details>
  );
}
