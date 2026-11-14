"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormAlert } from "@/components/ui/form-alert";
import type { ArchiveFormState } from "../actions";

type ArchiveAction = () => Promise<ArchiveFormState>;

/**
 * "Archive trip" with a confirmation (DESIGN_SYSTEM §56). On success the page
 * re-renders as archived and this component (with its dialog) unmounts.
 */
export function ArchiveTripButton({
  action,
  tripName,
}: {
  action: ArchiveAction;
  tripName: string;
}) {
  const [state, formAction] = useActionState<ArchiveFormState>(action, {});
  return (
    <ConfirmDialog
      triggerLabel="Archive trip"
      triggerVariant="danger"
      title="Archive this trip?"
      description={`“${tripName}” moves to Archived in My Trips and becomes read-only for everyone on it. You can unarchive it at any time.`}
      confirmLabel="Archive trip"
      pendingLabel="Archiving…"
      action={formAction}
      error={state.formError}
    />
  );
}

/** Unarchive needs no confirmation: it only restores the trip. Works without JS. */
export function UnarchiveTripForm({ action }: { action: ArchiveAction }) {
  const [state, formAction, pending] = useActionState<ArchiveFormState>(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <FormAlert message={state.formError} />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? "Unarchiving…" : "Unarchive trip"}
      </Button>
    </form>
  );
}
