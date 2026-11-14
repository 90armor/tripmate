"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { useSubmitWithoutReset } from "@/lib/use-submit-without-reset";
import type { CurrencyOption } from "@/modules/currencies/list-active-currencies";
import { createTripAction } from "../actions";
import { TripDetailsFields } from "./trip-details-fields";

export function CreateTripForm({
  timezones,
  currencies,
}: {
  timezones: readonly string[];
  currencies: readonly CurrencyOption[];
}) {
  const [state, formAction, pending] = useActionState(createTripAction, {});
  const onSubmit = useSubmitWithoutReset(formAction);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={state.formError} />
      <TripDetailsFields
        values={state.values ?? {}}
        errors={state.fieldErrors ?? {}}
        timezones={timezones}
        currencies={currencies}
      />
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
        <Link
          href="/trips"
          className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-body font-medium text-fg-secondary hover:bg-background hover:text-fg"
        >
          Cancel
        </Link>
        <Button type="submit" size="large" disabled={pending} className="sm:min-w-44">
          {pending ? "Creating trip…" : "Create trip"}
        </Button>
      </div>
    </form>
  );
}
