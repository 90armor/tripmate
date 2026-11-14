import Link from "next/link";
import { signOutAction } from "@/modules/auth/actions";

const navLink =
  "inline-flex min-h-11 items-center rounded-md px-3 text-body font-medium text-fg-secondary hover:bg-background hover:text-fg";

/** Account-level header (IA §4 global scope, §32): My Trips, Profile, Sign out. */
export function AppHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 sm:px-5 md:px-6">
        <Link
          href="/trips"
          className="inline-flex min-h-12 items-center text-h3 font-semibold text-action"
        >
          TripMate
        </Link>
        <nav aria-label="Account" className="flex items-center">
          <Link href="/profile" className={navLink}>
            Profile
          </Link>
          <form action={signOutAction}>
            <button type="submit" className={navLink}>
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
