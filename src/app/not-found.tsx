import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-8 sm:px-5 md:px-6 md:py-12">
      <h1 className="text-h2 font-semibold">Page not found</h1>
      <p className="text-body text-fg-secondary">This page doesn’t exist or may have moved.</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center self-start rounded-md text-body font-medium text-action underline underline-offset-4 hover:text-action-hover"
      >
        Go to TripMate home
      </Link>
    </main>
  );
}
