import { z } from "zod";

/**
 * Result of a form Server Action used with useActionState. `values` echoes the
 * submitted non-secret fields so the form keeps the user's input after an
 * error; passwords are never echoed.
 */
export type FormState<Field extends string> = {
  readonly fieldErrors?: Partial<Record<Field, string>>;
  readonly formError?: string;
  /** Confirmation for a successful save that stays on the same page. */
  readonly success?: string;
  readonly values?: Partial<Record<Field, string>>;
};

/** First message per field from a Zod error, for inline field errors. */
export function firstFieldErrors<Field extends string>(
  error: z.ZodError,
): Partial<Record<Field, string>> {
  const flattened = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const result: Partial<Record<Field, string>> = {};
  for (const [field, messages] of Object.entries(flattened)) {
    if (messages?.[0]) result[field as Field] = messages[0];
  }
  return result;
}

/** Reads string fields from FormData; files and missing fields become "". */
export function formValues<Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): Record<Field, string> {
  const values = {} as Record<Field, string>;
  for (const field of fields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return values;
}
