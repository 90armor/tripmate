"use client";

import { useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "./button";
import { FormAlert } from "./form-alert";

/**
 * Confirmation for a meaningful consequence (DESIGN_SYSTEM §56), e.g. "Archive
 * trip?". Native <dialog> opened with showModal(): the browser traps focus,
 * closes on Escape, makes the page behind inert and returns focus to the
 * trigger. Cancel gets initial focus so Enter never confirms by accident.
 *
 * The confirm button submits `action`; keep the dialog mounted while it runs so
 * `error` can be shown inside it. The caller unmounts it (or the page changes)
 * on success.
 */
export function ConfirmDialog({
  triggerLabel,
  triggerVariant = "secondary",
  title,
  description,
  confirmLabel,
  pendingLabel,
  confirmVariant = "danger",
  action,
  error,
}: {
  triggerLabel: string;
  triggerVariant?: ButtonVariant;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  confirmVariant?: ButtonVariant;
  action: (formData: FormData) => void;
  error?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <Button
        variant={triggerVariant}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-surface p-5 text-fg shadow-elevated backdrop:bg-fg/40"
      >
        <div className="flex flex-col gap-4">
          <h2 id={titleId} className="text-h3 font-semibold">
            {title}
          </h2>
          <p id={descriptionId} className="text-body text-fg-secondary">
            {description}
          </p>
          <FormAlert message={error} />
          <form action={action} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              // Safer default for a destructive choice.
              autoFocus
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <ConfirmButton
              variant={confirmVariant}
              label={confirmLabel}
              pendingLabel={pendingLabel}
            />
          </form>
        </div>
      </dialog>
    </>
  );
}

function ConfirmButton({
  variant,
  label,
  pendingLabel,
}: {
  variant: ButtonVariant;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
