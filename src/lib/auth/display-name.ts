import { z } from "zod";

/**
 * Display name rules (DATABASE §10). Lives with the auth configuration because
 * Better Auth writes the users row: the forms and the Better Auth user hooks
 * (user-write-guard.ts) must apply the same rule.
 */
export const DISPLAY_NAME_MAX = 100;

export const displayNameSchema = z
  .string({ error: "Enter your name" })
  .trim()
  .min(1, { error: "Enter your name" })
  .max(DISPLAY_NAME_MAX, { error: `Use ${DISPLAY_NAME_MAX} characters or fewer` });
