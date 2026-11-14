"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth/auth";
import { firstFieldErrors, formValues, type FormState } from "@/lib/form-state";
import { requireUser } from "@/modules/auth/session";
import { profileSchema } from "./schemas";

type ProfileField = "displayName";

export async function updateProfileAction(
  _previous: FormState<ProfileField>,
  formData: FormData,
): Promise<FormState<ProfileField>> {
  await requireUser("/profile");
  const values = formValues(formData, ["displayName"]);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error), values };

  const requestHeaders = await headers();
  try {
    // Better Auth owns the users row it maps onto (name → display_name, D1), and
    // updates its session data in the same call.
    await getAuth().api.updateUser({
      headers: requestHeaders,
      body: { name: parsed.data.displayName },
    });
  } catch {
    return { formError: "We couldn’t save your profile. Please try again.", values };
  }
  revalidatePath("/", "layout");
  return { success: "Profile saved.", values: { displayName: parsed.data.displayName } };
}
