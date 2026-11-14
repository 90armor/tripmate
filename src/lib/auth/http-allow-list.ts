import type { BetterAuthPlugin } from "better-auth";

/**
 * Better Auth endpoints reachable over HTTP (/api/auth/*): none. Every request
 * answers 404, including endpoints a future Better Auth version adds.
 *
 * TripMate never calls Better Auth over HTTP: sign-up, sign-in, sign-out,
 * sessions and profile updates all run in Server Actions / server code through
 * auth.api.* in-process, which does not pass through this check. There is no
 * browser auth client (authClient / useSession).
 *
 * Reopen a path only when a real client needs it (e.g. a native app), and then
 * together with rate limiting for public sign-up / sign-in. The user hooks
 * (user-write-guard.ts) protect the users row either way.
 *
 * Why not Better Auth's `disabledPaths`: it matches exact paths only, so it
 * cannot disable parameterised routes such as /callback/:id or
 * /reset-password/:token, and as a deny-list it would silently miss endpoints
 * added in an upgrade. An allow-list fails closed.
 */
export const HTTP_ENABLED_AUTH_PATHS: ReadonlySet<string> = new Set<string>();

/**
 * Better Auth's router base path: the path of the resolved baseURL, exactly as
 * the router computes it (`new URL(ctx.baseURL).pathname`). Better Auth keeps a
 * path already present in BETTER_AUTH_URL and only appends /api/auth when there
 * is none, so options.basePath alone can disagree with the router.
 */
export function routerBasePath(baseURL: string): string | null {
  try {
    return new URL(baseURL).pathname;
  } catch {
    return null;
  }
}

/** Path below the router base path, normalised like Better Auth's router. */
export function authRelativePath(requestUrl: string, basePath: string): string {
  let pathname: string;
  try {
    pathname = new URL(requestUrl).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return "/";
  }
  const base = basePath.replace(/\/+$/, "");
  if (base === "") return pathname;
  if (pathname === base) return "/";
  return pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname;
}

/**
 * Better Auth plugin that answers 404 for every HTTP request whose path is not
 * in `allowed` (default: HTTP_ENABLED_AUTH_PATHS, which is empty). Fails closed
 * when the base path cannot be determined.
 */
export function httpAllowList(
  allowed: ReadonlySet<string> = HTTP_ENABLED_AUTH_PATHS,
): BetterAuthPlugin {
  return {
    id: "tripmate-http-allow-list",
    async onRequest(request, ctx) {
      const basePath = routerBasePath(ctx.baseURL);
      if (basePath === null || !allowed.has(authRelativePath(request.url, basePath))) {
        return { response: new Response("Not Found", { status: 404 }) };
      }
    },
  };
}
