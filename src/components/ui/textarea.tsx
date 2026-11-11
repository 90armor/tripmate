import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import { FieldShell, controlBase, controlBorder, useFieldIds } from "./field";

export type TextareaProps = ComponentProps<"textarea"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  label,
  hint,
  error,
  id,
  className,
  rows = 3,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextareaProps) {
  const ids = useFieldIds({ id, hint, error, describedBy: ariaDescribedBy });
  return (
    <FieldShell
      label={label}
      controlId={ids.controlId}
      hint={hint}
      hintId={ids.hintId}
      error={error}
      errorId={ids.errorId}
    >
      <textarea
        id={ids.controlId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cx(controlBase, controlBorder(Boolean(error)), "min-h-24 py-2.5", className)}
        {...props}
      />
    </FieldShell>
  );
}
