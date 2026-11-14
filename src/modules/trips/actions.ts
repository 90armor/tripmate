"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { ValidationError } from "@/lib/errors";
import { formValues, type FormState } from "@/lib/form-state";
import { requireUser } from "@/modules/auth/session";
import { TRIP_DETAILS_FIELDS, type TripDetailsField } from "./schemas";
import { createTrip } from "./services/create-trip";

export type TripFormState = FormState<TripDetailsField>;

const CHECK_FIELDS = "Some details need fixing. Check the highlighted fields.";
const UNAVAILABLE = "We couldn’t save the trip just now. Your details are still here — try again.";

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
