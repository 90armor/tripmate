import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { getAuth } from "@/lib/auth/auth";

export type CurrentUser = AuthenticatedUser & {
  readonly email: string;
  readonly displayName: string;
};

/**
 * The signed-in user for this request, or null. Server-side session lookup
 * (CURRENT_TASK §4.1); cached so a layout and its page share one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Read request headers first: it marks the route dynamic before getAuth()
  // needs runtime configuration, so `next build` never tries to prerender it.
  const requestHeaders = await headers();
  const result = await getAuth().api.getSession({ headers: requestHeaders });
  if (!result) return null;
  return { id: result.user.id, email: result.user.email, displayName: result.user.name };
});

/**
 * Requires a signed-in user, otherwise redirects to Sign In and returns to
 * `returnTo` afterwards. Call it in every protected page and Server Action:
 * App Router layouts are not re-run on client navigation, so a layout-only
 * check does not protect child routes.
 */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}
