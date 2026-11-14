import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { NotFoundError } from "@/lib/errors";
import { getCurrentUser, requireUser } from "@/modules/auth/session";
import { getTripWorkspace } from "./queries/get-trip-workspace";
import { listMyTrips } from "./queries/list-my-trips";

/*
 * Request-scoped loaders for the Trip Workspace (presentation layer). Every page
 * and the layout call loadTripPage() themselves — App Router layouts are not
 * re-run on client navigation, so a layout-only check would not protect pages.
 * React cache() makes the repeated calls in one request a single lookup.
 */

const workspaceFor = cache(async (userId: string, tripId: string) => {
  try {
    return await getTripWorkspace(getDb(), { id: userId }, tripId, new Date());
  } catch (error) {
    // Missing trip and someone else's trip render the same not-found page.
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
});

/** Signed-in user + trip they are an ACTIVE member of, or redirect / not-found. */
export async function loadTripPage(tripId: string, subpath = "") {
  const user = await requireUser(`/trips/${tripId}${subpath}`);
  const trip = await workspaceFor(user.id, tripId);
  return { user, trip };
}

/**
 * For the workspace layout. A layout cannot see the full URL, so when nobody is
 * signed in it returns null and lets the page redirect: the page knows its own
 * path (e.g. /trips/{id}/plan) and Sign In then returns there, not to the trip
 * root. The page's own loadTripPage() call still enforces access.
 */
export async function loadTripShell(tripId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user, trip: await workspaceFor(user.id, tripId) };
}

/** The user's non-archived trips, for the desktop trip switcher. */
export const loadSwitcherTrips = cache(async (userId: string) => {
  const trips = await listMyTrips(getDb(), { id: userId }, new Date());
  return trips.filter((trip) => !trip.archived).map(({ id, name }) => ({ id, name }));
});
