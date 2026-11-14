import { useId, type ReactNode } from "react";
import { Label } from "./label";

/**
 * Shared label / hint / error wiring for text controls (DESIGN_SYSTEM §30):
 * visible label, control, support or error text linked via aria-describedby.
 */
export function useFieldIds(options: {
  id: string | undefined;
  hint: string | undefined;
  error: string | undefined;
  describedBy: string | undefined;
}) {
  const generatedId = useId();
  const controlId = options.id ?? generatedId;
  const hintId = options.hint ? `${controlId}-hint` : undefined;
  const errorId = options.error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId, options.describedBy].filter(Boolean).join(" ") || undefined;
  return { controlId, hintId, errorId, describedBy };
}

export function FieldShell({
  label,
  controlId,
  hint,
  hintId,
  error,
  errorId,
  children,
}: {
  label: string;
  controlId: string;
  hint: string | undefined;
  hintId: string | undefined;
  error: string | undefined;
  errorId: string | undefined;
  children: ReactNode;
}) {
  return (
    // min-w-0: as a grid or flex item the field may shrink below its control's
    // intrinsic width (iOS gives date inputs a wide one), so it never overflows.
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={controlId}>{label}</Label>
      {children}
      {hint ? (
        <p id={hintId} className="text-small text-fg-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/*
 * 16px text (text-body-lg) on controls is intentional: iOS Safari zooms the page
 * when focusing inputs with a smaller font size.
 */
export const controlBase =
  "w-full min-w-0 rounded-md border bg-surface px-3 text-body-lg text-fg placeholder:text-fg-muted " +
  "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled";

export function controlBorder(hasError: boolean): string {
  return hasError ? "border-danger" : "border-border-strong";
}
