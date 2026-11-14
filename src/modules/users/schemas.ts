import { z } from "zod";
import { displayNameSchema } from "@/modules/auth/schemas";

/**
 * Basic profile (ROADMAP D18): display name is editable; email is read-only and
 * deliberately absent here so it can never be changed through this form.
 */
export const profileSchema = z.object({ displayName: displayNameSchema });
export type ProfileInput = z.infer<typeof profileSchema>;
