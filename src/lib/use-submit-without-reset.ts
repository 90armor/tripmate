"use client";

import { startTransition, type FormEvent } from "react";

/**
 * onSubmit handler that runs a useActionState action without React 19's
 * automatic form reset. The reset re-applies defaultValue to inputs but not to
 * <select> (the select falls back to its first option), so after a validation
 * error the traveler would lose their currency choice. Keep `action={formAction}`
 * on the form as well, so it still submits without JavaScript.
 */
export function useSubmitWithoutReset(formAction: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };
}
