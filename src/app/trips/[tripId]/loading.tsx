import { Skeleton } from "@/components/ui/skeleton";

/** Workspace page loading: the shell stays; only the page content is a skeleton. */
export default function TripPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <p role="status" className="sr-only">
        Loading…
      </p>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}
