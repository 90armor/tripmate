import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import { FieldShell, controlBase, controlBorder, useFieldIds } from "./field";

export type InputProps = ComponentProps<"input"> & {
  /** Visible label — placeholders are never a substitute (DESIGN_SYSTEM §30). */
  label: string;
  hint?: string;
  error?: string;
};

export function Input({
  label,
  hint,
  error,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputProps) {
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
      <input
        id={ids.controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cx(controlBase, controlBorder(Boolean(error)), "h-12", className)}
        {...props}
      />
    </FieldShell>
  );
}
