import Link from "next/link";
import { signOutAction } from "@/modules/auth/actions";

/** Account-level header (IA §4 global scope): home link and sign out. */
export function AppHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-5 md:px-6">
        <Link
          href="/trips"
          className="inline-flex min-h-12 items-center text-h3 font-semibold text-action"
        >
          TripMate
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md px-3 text-body font-medium text-fg-secondary hover:bg-background hover:text-fg"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
