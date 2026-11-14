"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  AuthorizationError,
  NotFoundError,
  TripArchivedError,
  ValidationError,
} from "@/lib/errors";
import { formValues, type FormState } from "@/lib/form-state";
import { requireUser } from "@/modules/auth/session";
import {
  TRIP_DETAILS_FIELDS,
  TRIP_SETTINGS_FIELDS,
  type TripDetailsField,
  type TripSettingsField,
} from "./schemas";
import { createTrip } from "./services/create-trip";
import { setTripArchived } from "./services/set-trip-archived";
import { updateTripSettings } from "./services/update-trip-settings";

export type TripFormState = FormState<TripDetailsField>;
export type TripSettingsFormState = FormState<TripSettingsField>;
export type ArchiveFormState = { readonly formError?: string };

const CHECK_FIELDS = "Some details need fixing. Check the highlighted fields.";
const UNAVAILABLE = "We couldn’t save the trip just now. Your details are still here — try again.";
const OWNER_ONLY = "Only the trip owner can change trip settings.";

/** Thin transport layer: the use case and its validation live in createTrip(). */
export async function createTripAction(
  _previous: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await requireUser("/trips/new");
  const values = formValues(formData, TRIP_DETAILS_FIELDS);

  let tripId: string;
  try {
    ({ tripId } = await createTrip(getDb(), user, values));
  } catch (error) {
    if (error instanceof ValidationError) {
      return { formError: CHECK_FIELDS, fieldErrors: error.fieldErrors, values };
    }
    // Unexpected failure: the transaction rolled back; nothing was saved.
    console.error("createTrip failed", { userId: user.id, error });
    return { formError: UNAVAILABLE, values };
  }
  redirect(`/trips/${tripId}`);
}

/**
 * Message for an expected trip-write failure, or undefined. A missing trip or
 * someone else's trip renders the not-found page, exactly like reading it.
 */
function tripWriteError(error: unknown): string | undefined {
  if (error instanceof NotFoundError) notFound();
  if (error instanceof TripArchivedError) return error.message;
  if (error instanceof AuthorizationError) return OWNER_ONLY;
  return undefined;
}

/** Trip Settings form (CURRENT_TASK §4.5). `tripId` is bound by the page. */
export async function updateTripSettingsAction(
  tripId: string,
  _previous: TripSettingsFormState,
  formData: FormData,
): Promise<TripSettingsFormState> {
  const user = await requireUser(`/trips/${tripId}/settings`);
  const values = formValues(formData, TRIP_SETTINGS_FIELDS);

  try {
    await updateTripSettings(getDb(), user, tripId, values);
  } catch (error) {
    if (error instanceof ValidationError) {
      return { formError: CHECK_FIELDS, fieldErrors: error.fieldErrors, values };
    }
    const message = tripWriteError(error);
    if (message) return { formError: message, values };
    console.error("updateTripSettings failed", { userId: user.id, tripId, error });
    return { formError: UNAVAILABLE, values };
  }
  // Name, dates and status appear in the workspace header, switcher and My Trips.
  revalidatePath("/trips", "layout");
  return { success: "Trip settings saved.", values };
}

/**
 * Archive (archived = true) or unarchive a trip. Both arguments are bound by
 * the page; used with useActionState, whose state and form data it ignores.
 */
export async function setTripArchivedAction(
  tripId: string,
  archived: boolean,
): Promise<ArchiveFormState> {
  const user = await requireUser(`/trips/${tripId}/settings`);
  try {
    await setTripArchived(getDb(), user, tripId, archived);
  } catch (error) {
    const message = tripWriteError(error);
    if (message) return { formError: message };
    console.error("setTripArchived failed", { userId: user.id, tripId, archived, error });
    return {
      formError: archived
        ? "We couldn’t archive the trip just now. Try again."
        : "We couldn’t unarchive the trip just now. Try again.",
    };
  }
  revalidatePath("/trips", "layout");
  return {};
}
