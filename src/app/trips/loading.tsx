import { Skeleton } from "@/components/ui/skeleton";

/** My Trips loading state: the list layout is predictable, so skeleton cards. */
export default function MyTripsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-5 md:px-6 md:py-10">
      <p role="status" className="sr-only">
        Loading your trips…
      </p>
      <Skeleton className="h-9 w-40" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
