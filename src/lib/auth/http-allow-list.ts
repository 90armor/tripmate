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

const DEFAULT_BASE_PATH = "/api/auth";

/** Path below the auth base path, normalised like Better Auth's router. */
export function authRelativePath(requestUrl: string, basePath = DEFAULT_BASE_PATH): string {
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

export function httpAllowList(): BetterAuthPlugin {
  return {
    id: "tripmate-http-allow-list",
    async onRequest(request, ctx) {
      const path = authRelativePath(request.url, ctx.options.basePath ?? DEFAULT_BASE_PATH);
      if (!HTTP_ENABLED_AUTH_PATHS.has(path)) {
        return { response: new Response("Not Found", { status: 404 }) };
      }
    },
  };
}
