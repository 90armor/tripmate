"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { signUpAction } from "../actions";
import { MIN_PASSWORD_LENGTH } from "../schemas";

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, {});
  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <FormAlert message={state.formError} />
      <input type="hidden" name="next" value={next} />
      <Input
        label="Your name"
        name="displayName"
        autoComplete="name"
        hint="Shown to people you travel with."
        required
        defaultValue={state.values?.displayName}
        error={state.fieldErrors?.displayName}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        minLength={MIN_PASSWORD_LENGTH}
        required
        error={state.fieldErrors?.password}
      />
      <Button type="submit" size="large" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
