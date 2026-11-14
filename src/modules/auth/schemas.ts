import { z } from "zod";

/*
 * Sign-up / sign-in input (CURRENT_TASK §4.1, ROADMAP D14). Shared by the forms
 * and the Server Actions; the server parse is authoritative.
 */

export const MIN_PASSWORD_LENGTH = 8;
// Better Auth's default maximum; stated so the form and the server agree.
export const MAX_PASSWORD_LENGTH = 128;

// Emails are stored lowercase (ROADMAP D10). Normalising here as well as in
// Better Auth keeps validation messages and lookups consistent.
export const emailSchema = z
  .string({ error: "Enter your email" })
  .trim()
  .toLowerCase()
  .min(1, { error: "Enter your email" })
  .pipe(z.email({ error: "Enter a valid email address" }));

export const displayNameSchema = z
  .string({ error: "Enter your name" })
  .trim()
  .min(1, { error: "Enter your name" })
  .max(100, { error: "Use 100 characters or fewer" });

export const signUpSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: z
    .string({ error: "Enter a password" })
    .min(MIN_PASSWORD_LENGTH, { error: `Use at least ${MIN_PASSWORD_LENGTH} characters` })
    .max(MAX_PASSWORD_LENGTH, { error: `Use ${MAX_PASSWORD_LENGTH} characters or fewer` }),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  // No length rule on sign-in: never hint at password policy for an existing account.
  password: z.string({ error: "Enter your password" }).min(1, { error: "Enter your password" }),
});
export type SignInInput = z.infer<typeof signInSchema>;
