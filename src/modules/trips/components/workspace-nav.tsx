"use client";

import {
  ClipboardCheck,
  Luggage,
  Map,
  Plus,
  Settings,
  Sun,
  Ticket,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

type NavItem = { href: string; label: string; icon: LucideIcon; match: (rest: string) => boolean };

const startsWith = (prefix: string) => (rest: string) =>
  rest === prefix || rest.startsWith(`${prefix}/`);

// `rest` is the path after /trips/{id}: "" for Overview, "/plan", ...
const TODAY: NavItem = { href: "/today", label: "Today", icon: Sun, match: startsWith("/today") };
const PLAN: NavItem = { href: "/plan", label: "Plan", icon: Map, match: startsWith("/plan") };
const EXPENSES: NavItem = {
  href: "/expenses",
  label: "Expenses",
  icon: Wallet,
  match: startsWith("/expenses"),
};
const TRIP_SECTIONS = ["/members", "/bookings", "/checklist", "/settings"];

/** Mobile "Trip" tab covers Overview and the Trip section pages (IA §22). */
const TRIP_TAB: NavItem = {
  href: "",
  label: "Trip",
  icon: Luggage,
  match: (rest) => rest === "" || TRIP_SECTIONS.some((s) => startsWith(s)(rest)),
};

const DESKTOP_TRIP: NavItem[] = [
  { href: "", label: "Trip", icon: Luggage, match: (rest) => rest === "" },
  { href: "/members", label: "Members", icon: Users, match: startsWith("/members") },
  { href: "/bookings", label: "Bookings", icon: Ticket, match: startsWith("/bookings") },
  { href: "/checklist", label: "Checklist", icon: ClipboardCheck, match: startsWith("/checklist") },
  { href: "/settings", label: "Settings", icon: Settings, match: startsWith("/settings") },
];

function useRestOfPath(tripId: string): string {
  const pathname = usePathname();
  const base = `/trips/${tripId}`;
  return pathname.toLowerCase().startsWith(base.toLowerCase()) ? pathname.slice(base.length) : "";
}

/**
 * Mobile bottom navigation (IA §5, DESIGN_SYSTEM §24–26): Today, Plan, +,
 * Expenses, Trip. Icon + label, ≥ 56px tall, safe-area aware; the active tab
 * is marked with aria-current and a top bar + weight, not colour alone.
 */
export function MobileTripNav({ tripId }: { tripId: string }) {
  const rest = useRestOfPath(tripId);
  const base = `/trips/${tripId}`;
  const addActive = startsWith("/add")(rest);
  return (
    <nav
      aria-label="Trip"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {[TODAY, PLAN].map((item) => (
          <li key={item.label}>
            <TabLink base={base} item={item} active={item.match(rest)} />
          </li>
        ))}
        <li className="flex items-center justify-center">
          <Link
            href={`${base}/add`}
            aria-current={addActive ? "page" : undefined}
            className="flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 text-caption font-semibold text-action"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-action text-on-action">
              <Plus aria-hidden className="size-5" />
            </span>
            Add
          </Link>
        </li>
        {[EXPENSES, TRIP_TAB].map((item) => (
          <li key={item.label}>
            <TabLink base={base} item={item} active={item.match(rest)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TabLink({ base, item, active }: { base: string; item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={`${base}${item.href}`}
      aria-current={active ? "page" : undefined}
      className={cx(
        "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-caption",
        active ? "font-semibold text-action" : "font-medium text-fg-secondary hover:text-fg",
      )}
    >
      {active ? (
        <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-action" />
      ) : null}
      <Icon aria-hidden className="size-5" />
      {item.label}
    </Link>
  );
}

/** Desktop sidebar trip navigation (IA §34, DESIGN_SYSTEM §73). */
export function DesktopTripNav({ tripId }: { tripId: string }) {
  const rest = useRestOfPath(tripId);
  const base = `/trips/${tripId}`;
  return (
    <nav aria-label="Trip" className="flex flex-col gap-4">
      <SidebarGroup base={base} rest={rest} items={[TODAY, PLAN, EXPENSES]} />
      <SidebarGroup base={base} rest={rest} items={DESKTOP_TRIP} />
    </nav>
  );
}

function SidebarGroup({ base, rest, items }: { base: string; rest: string; items: NavItem[] }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.match(rest);
        const Icon = item.icon;
        return (
          <li key={item.label}>
            <Link
              href={`${base}${item.href}`}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-body",
                active
                  ? "bg-action-subtle font-semibold text-action"
                  : "font-medium text-fg-secondary hover:bg-background hover:text-fg",
              )}
            >
              <Icon aria-hidden className="size-5" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
