import { Skeleton } from "@/components/ui/skeleton";

export default function NewTripLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-5 md:px-6 md:py-10">
      <p role="status" className="sr-only">
        Loading the trip form…
      </p>
      <Skeleton className="h-9 w-48" />
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </main>
  );
}
