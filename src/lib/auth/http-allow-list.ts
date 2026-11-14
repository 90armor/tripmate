import type { BetterAuthPlugin } from "better-auth";

/**
 * The only Better Auth endpoints reachable over HTTP (/api/auth/*). Everything
 * else answers 404, including endpoints a future Better Auth version adds.
 *
 * TripMate's own pages never call these over HTTP: the Server Actions call
 * auth.api.* in-process, which does not go through this check. The four kept
 * are Better Auth's public form of exactly the M1 flows (ROADMAP D1, D14), and
 * expose nothing the sign-up / sign-in pages don't already:
 *
 * - /sign-up/email  create an account (same rules as the form: Better Auth
 *                   lowercases email, min password 8; the user hooks check the
 *                   name and drop the avatar)
 * - /sign-in/email  start a session
 * - /sign-out       end the caller's own session
 * - /get-session    read the caller's own session (read-only)
 *
 * Disabled on purpose, among others: /update-user (profile changes go through
 * the Profile form), /change-email (email is read-only, D18), /change-password,
 * /delete-user, password reset and email verification (no email provider,
 * D14), social sign-in and account linking, session listing / revocation.
 *
 * Why not Better Auth's `disabledPaths`: it matches exact paths only, so it
 * cannot disable parameterised routes such as /callback/:id or
 * /reset-password/:token, and as a deny-list it would silently miss endpoints
 * added in an upgrade. An allow-list fails closed.
 */
export const HTTP_ENABLED_AUTH_PATHS: ReadonlySet<string> = new Set([
  "/sign-up/email",
  "/sign-in/email",
  "/sign-out",
  "/get-session",
]);

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
