"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "../actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {});
  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <FormAlert message={state.formError} />
      <Input
        label="Display name"
        name="displayName"
        autoComplete="name"
        hint="Shown to people you travel with."
        required
        defaultValue={state.values?.displayName ?? displayName}
        error={state.fieldErrors?.displayName}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
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
