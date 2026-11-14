import { z } from "zod";
import { isValidDateString } from "@/domain/trips/dates";
import { isSupportedTimeZone } from "@/lib/timezones";

/*
 * Trip details shared by Create Trip and Trip Settings (CURRENT_TASK §4.3, §4.5).
 * The client form may reuse it; the server parse is authoritative. Whether the
 * currency exists and is active is checked against the database in the service.
 */

export const TRIP_NAME_MAX = 100;
export const DESTINATION_MAX = 100;

const requiredText = (required: string, max: number) =>
  z
    .string({ error: required })
    .trim()
    .min(1, { error: required })
    .max(max, { error: `Use ${max} characters or fewer` });

const calendarDate = (required: string) =>
  z
    .string({ error: required })
    .trim()
    .min(1, { error: required })
    // Empty is reported once, by min(1). (Not `abort`: an aborting issue also
    // stops the object-level date-order check below.)
    .refine((value) => value === "" || isValidDateString(value), { error: "Enter a real date" });

export const tripDetailsSchema = z
  .object({
    name: requiredText("Enter a trip name", TRIP_NAME_MAX),
    destination: requiredText("Enter a destination", DESTINATION_MAX),
    startDate: calendarDate("Choose a start date"),
    endDate: calendarDate("Choose an end date"),
    // No default and no device guess (ROADMAP D15): the traveler picks it.
    timezone: z
      .string({ error: "Choose a timezone" })
      .trim()
      .min(1, { error: "Choose a timezone" })
      .refine((value) => value === "" || isSupportedTimeZone(value), {
        error: "Choose a timezone from the list",
      }),
    baseCurrency: z
      .string({ error: "Choose a currency" })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, { error: "Choose a currency" }),
  })
  // One-day trips (start = end) and trips already in progress are valid.
  // YYYY-MM-DD strings compare correctly as text.
  .refine((trip) => trip.endDate >= trip.startDate, {
    path: ["endDate"],
    error: "End date can’t be before the start date",
    // Object refinements are skipped when any field has an issue. Run this one
    // whenever both dates are valid, so a missing timezone does not hide a
    // reversed date range (all errors show on the first submit).
    when: (payload) =>
      !payload.issues.some(
        (issue) => issue.path?.[0] === "startDate" || issue.path?.[0] === "endDate",
      ),
  });

export type TripDetailsInput = z.infer<typeof tripDetailsSchema>;
export type TripDetailsField = keyof TripDetailsInput;
export const TRIP_DETAILS_FIELDS = [
  "name",
  "destination",
  "startDate",
  "endDate",
  "timezone",
  "baseCurrency",
] as const satisfies readonly TripDetailsField[];
