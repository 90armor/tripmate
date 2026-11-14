import { Archive, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/modules/auth/actions";
import { DesktopTripNav, MobileTripNav } from "@/modules/trips/components/workspace-nav";
import { TripSwitcher } from "@/modules/trips/components/trip-switcher";
import { loadSwitcherTrips, loadTripShell } from "@/modules/trips/load-workspace";
import { tripHeadline } from "@/modules/trips/trip-headline";

const accountLink =
  "flex min-h-11 w-full items-center rounded-md px-3 text-body font-medium text-fg-secondary hover:bg-background hover:text-fg";

/**
 * Trip Workspace shell (CURRENT_TASK §4.4, IA §5, §34). Mobile: compact header
 * + bottom navigation. Desktop (lg): sidebar with trip switcher and full
 * navigation. Each page still runs its own access check via loadTripPage().
 */
export default async function TripWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const shell = await loadTripShell(tripId);
  // Signed out: the page redirects to Sign In with its exact path.
  if (!shell) return children;
  const { user, trip } = shell;
  const switcherTrips = await loadSwitcherTrips(user.id);
  const headline = tripHeadline(trip);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface px-3 py-5 lg:flex">
        <Link href="/trips" className="px-3 text-h3 font-semibold text-action">
          TripMate
        </Link>
        <TripSwitcher current={trip} trips={switcherTrips} />
        <DesktopTripNav tripId={trip.id} />
        <nav
          aria-label="Account"
          className="mt-auto flex flex-col gap-0.5 border-t border-border pt-4"
        >
          <Link href="/trips" className={accountLink}>
            My Trips
          </Link>
          <Link href="/profile" className={accountLink}>
            Profile
          </Link>
          <form action={signOutAction}>
            <button type="submit" className={accountLink}>
              Sign out
            </button>
          </form>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur-sm lg:static lg:bg-surface">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-2 py-1 sm:px-4 lg:px-6 lg:py-3">
            <Link
              href="/trips"
              className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-md pr-2 text-body font-medium text-fg-secondary hover:bg-background hover:text-fg lg:hidden"
            >
              <ChevronLeft aria-hidden className="size-5" />
              Trips
            </Link>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-body-lg font-semibold text-fg">{trip.name}</p>
              <p className="flex items-center gap-1.5 truncate text-small text-fg-secondary">
                {trip.archived ? (
                  <>
                    <Archive aria-hidden className="size-3.5 shrink-0" />
                    <span>Archived ·</span>
                  </>
                ) : null}
                {headline}
              </p>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-5 md:px-6 lg:pb-12">
          {children}
        </main>
      </div>

      <MobileTripNav tripId={trip.id} />
    </div>
  );
}
