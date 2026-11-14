import { z } from "zod";

/*
 * Bound Server Action arguments (`action.bind(null, tripId, …)`) come back from
 * the browser as data, like any other input: TypeScript types do not hold at
 * runtime. Parse them before use. Authorization still happens in the services;
 * this only rejects malformed values (e.g. archived = "false", a truthy string).
 */

const tripIdArg = z.uuid();
const archiveArgs = z.object({ tripId: tripIdArg, archived: z.boolean() });

/** The trip id, or null when it is not a UUID. */
export function parseTripIdArg(tripId: unknown): string | null {
  const parsed = tripIdArg.safeParse(tripId);
  return parsed.success ? parsed.data : null;
}

/** Archive arguments, or null unless tripId is a UUID and archived a real boolean. */
export function parseArchiveArgs(
  tripId: unknown,
  archived: unknown,
): { tripId: string; archived: boolean } | null {
  const parsed = archiveArgs.safeParse({ tripId, archived });
  return parsed.success ? parsed.data : null;
}
