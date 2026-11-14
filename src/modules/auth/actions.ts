"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/auth";
import { firstFieldErrors, formValues, type FormState } from "@/lib/form-state";
import { safeRedirectPath } from "./safe-redirect";
import { signInSchema, signUpSchema } from "./schemas";

type SignUpField = "displayName" | "email" | "password";
type SignInField = "email" | "password";

/*
 * Without email verification (ROADMAP D14) a duplicate sign-up has to fail
 * visibly, so the email's existence cannot be fully hidden. The wording stays
 * neutral and never says "already registered".
 */
const SIGN_UP_REJECTED =
  "We couldn’t create an account with that email. If you already have one, sign in instead.";
const SIGN_IN_REJECTED = "That email and password don’t match. Check them and try again.";
const UNAVAILABLE = "We couldn’t reach TripMate just now. Please try again.";

export async function signUpAction(
  _previous: FormState<SignUpField>,
  formData: FormData,
): Promise<FormState<SignUpField>> {
  const raw = formValues(formData, ["displayName", "email", "password"]);
  const values = { displayName: raw.displayName, email: raw.email };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error), values };

  const requestHeaders = await headers();
  try {
    await getAuth().api.signUpEmail({
      headers: requestHeaders,
      body: {
        name: parsed.data.displayName,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
  } catch (error) {
    // Only the error category is decided here; nothing about the input is logged.
    return { formError: isAPIError(error) ? SIGN_UP_REJECTED : UNAVAILABLE, values };
  }
  // redirect() throws, so it must stay outside the try/catch.
  redirect(safeRedirectPath(formData.get("next")));
}

export async function signInAction(
  _previous: FormState<SignInField>,
  formData: FormData,
): Promise<FormState<SignInField>> {
  const raw = formValues(formData, ["email", "password"]);
  const values = { email: raw.email };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error), values };

  const requestHeaders = await headers();
  try {
    await getAuth().api.signInEmail({ headers: requestHeaders, body: parsed.data });
  } catch (error) {
    return { formError: isAPIError(error) ? SIGN_IN_REJECTED : UNAVAILABLE, values };
  }
  redirect(safeRedirectPath(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  const requestHeaders = await headers();
  await getAuth().api.signOut({ headers: requestHeaders });
  redirect("/sign-in");
}
