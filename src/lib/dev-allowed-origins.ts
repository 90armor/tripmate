/**
 * DEV_ALLOWED_ORIGINS: optional, comma-separated hostnames that may load the
 * `next dev` server's own resources (HMR socket, dev chunks), e.g. your LAN IP
 * for phone testing: `DEV_ALLOWED_ORIGINS=192.168.1.20`. Becomes next.config's
 * `allowedDevOrigins`; it has no effect on production builds.
 *
 * Without it, Next.js 16 refuses the HMR socket for any host other than
 * localhost; the dev client then retries for ~40 s and reloads the page, wiping
 * whatever the tester had typed.
 *
 * Entries are hostnames (Next.js matches the request's Origin hostname), not
 * URLs: no scheme, port or path. A leading `*.` or `**.` wildcard is allowed.
 */
const HOSTNAME_PATTERN =
  /^(\*{1,2}\.)?(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

/** Problems with the value, as messages that never repeat the value itself. */
export function devAllowedOriginsProblems(value: string): string[] {
  return splitEntries(value).flatMap((entry, index) =>
    HOSTNAME_PATTERN.test(entry)
      ? []
      : [`entry ${index + 1} must be a hostname such as 192.168.1.20 (no http://, port or path)`],
  );
}

/** Parsed hostnames; [] when unset. Throws on an invalid entry. */
export function parseDevAllowedOrigins(value: string | undefined): string[] {
  if (value === undefined) return [];
  const problems = devAllowedOriginsProblems(value);
  if (problems.length > 0) {
    throw new Error(`DEV_ALLOWED_ORIGINS: ${problems.join("; ")}`);
  }
  return splitEntries(value).map((entry) => entry.toLowerCase());
}

function splitEntries(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}
