export const DEFAULT_SIGNED_IN_PATH = "/trips";

// Placeholder origin used only to resolve the candidate path; never navigated to.
const BASE = new URL("http://tripmate.invalid");

/**
 * Returns `candidate` only when it is a same-origin relative path, otherwise the
 * fallback. Prevents open redirects through `?next=` after sign-in.
 *
 * Resolving with the URL parser (rather than string checks alone) catches what
 * browsers would treat as another host: `//evil.com`, `/\evil.com`, `\\evil.com`,
 * tab/newline-smuggled variants, and absolute URLs with any scheme.
 */
export function safeRedirectPath(
  candidate: unknown,
  fallback: string = DEFAULT_SIGNED_IN_PATH,
): string {
  if (typeof candidate !== "string" || !candidate.startsWith("/")) return fallback;
  // Backslashes and control characters have no place in our own paths.
  if (/[\\\u0000-\u001f\u007f]/.test(candidate)) return fallback;

  let resolved: URL;
  try {
    resolved = new URL(candidate, BASE);
  } catch {
    return fallback;
  }
  if (resolved.origin !== BASE.origin) return fallback;
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
