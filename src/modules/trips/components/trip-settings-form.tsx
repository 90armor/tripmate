"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Select } from "@/components/ui/select";
import { TRIP_STATUSES } from "@/domain/trips/status";
import { useSubmitWithoutReset } from "@/lib/use-submit-without-reset";
import type { CurrencyOption } from "@/modules/currencies/list-active-currencies";
import type { TripSettingsFormState } from "../actions";
import type { TripSettingsField } from "../schemas";
import { TRIP_STATUS_LABELS } from "../status-label";
import { TripDetailsFields } from "./trip-details-fields";

type Values = Partial<Record<TripSettingsField, string>>;

/**
 * Trip Settings form (CURRENT_TASK §4.5). Rendered for the OWNER of an active
 * trip only; the server enforces both again. `action` has the trip id bound.
 */
export function TripSettingsForm({
  action,
  saved,
  automaticStatus,
  timezones,
  currencies,
}: {
  action: (state: TripSettingsFormState, formData: FormData) => Promise<TripSettingsFormState>;
  /** The trip's current settings, used until the first submission. */
  saved: Values;
  /** Label of the status the dates give, shown on the "Automatic" choice. */
  automaticStatus: string;
  timezones: readonly string[];
  currencies: readonly CurrencyOption[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const onSubmit = useSubmitWithoutReset(formAction);
  const values = state.values ?? saved;
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={state.formError} />
      <TripDetailsFields
        values={values}
        errors={errors}
        timezones={timezones}
        currencies={currencies}
      />
      {/* Manual override (ROADMAP D7): the escape hatch when dates aren't the whole story. */}
      <Select
        label="Trip status"
        name="statusOverride"
        hint="Automatic follows the trip dates. Choose a status only if the dates don’t tell the whole story."
        placeholder={`Automatic (${automaticStatus})`}
        options={TRIP_STATUSES.map((status) => ({
          value: status,
          label: TRIP_STATUS_LABELS[status],
        }))}
        defaultValue={values.statusOverride ?? ""}
        error={errors.statusOverride}
      />
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <Button type="submit" size="large" disabled={pending} className="sm:min-w-44">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {/* Always rendered so screen readers announce the message when it appears. */}
        <p role="status" className="flex items-center gap-1.5 text-body text-success">
          {state.success && !pending ? (
            <>
              <CircleCheck aria-hidden className="size-4" />
              {state.success}
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}
