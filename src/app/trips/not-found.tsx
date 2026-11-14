import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";

/**
 * Shown for a trip that does not exist AND for a trip the user is not an active
 * member of — one page for both, so it never reveals that a trip exists
 * (CURRENT_TASK §4.6).
 */
export default function TripNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-8 sm:px-5 md:px-6 md:py-12">
      <h1 className="text-h2 font-semibold">Trip not found</h1>
      <p className="text-body text-fg-secondary">
        This trip doesn’t exist, or you’re not a traveler on it. If someone shared it with you, ask
        them to invite you.
      </p>
      <Link href="/trips" className={buttonClassName({ element: "link", className: "self-start" })}>
        Go to My Trips
      </Link>
    </main>
  );
}
