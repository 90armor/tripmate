import { APIError } from "better-auth/api";
import { displayNameSchema } from "./display-name";

/**
 * Runs in Better Auth's `databaseHooks.user.create.before` and
 * `user.update.before`, so it applies to EVERY write of the users row: the
 * TripMate forms (via auth.api) and any Better Auth endpoint, whatever its own
 * body schema accepts.
 *
 * - `name` (display_name) must already satisfy displayNameSchema. It is
 *   rejected, not trimmed: our forms send normalised values, so anything else
 *   came from outside them.
 * - `image` (avatar_url) is always written as NULL: no avatars in M1 (ROADMAP D18).
 *
 * Returns the data to write. Other fields pass through unchanged.
 */
export function guardUserWrite<T extends Record<string, unknown>>(data: T): T {
  if (data.name !== undefined) {
    const parsed = displayNameSchema.safeParse(data.name);
    if (!parsed.success) {
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_DISPLAY_NAME",
        message: parsed.error.issues[0]?.message ?? "Enter your name",
      });
    }
    if (parsed.data !== data.name) {
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_DISPLAY_NAME",
        message: "Remove spaces at the start or end of the name",
      });
    }
  }
  // Overwrite rather than delete: Better Auth merges the hook's result into the
  // original data ({ ...original, ...result }), so a missing key would keep it.
  return data.image === undefined ? data : { ...data, image: null };
}
