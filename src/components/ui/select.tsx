import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import { FieldShell, controlBase, controlBorder, useFieldIds } from "./field";

export type SelectOption = { value: string; label: string };

export type SelectProps = Omit<ComponentProps<"select">, "children"> & {
  /** Visible label (DESIGN_SYSTEM §30). */
  label: string;
  hint?: string;
  error?: string;
  options: readonly SelectOption[];
  /** Shown as an empty first option, so nothing is preselected by accident. */
  placeholder?: string;
};

/**
 * Native select: on phones it opens the OS picker, which is the most usable
 * long-list chooser on a small screen (DESIGN_SYSTEM §33).
 */
export function Select({
  label,
  hint,
  error,
  id,
  className,
  options,
  placeholder,
  "aria-describedby": ariaDescribedBy,
  ...props
}: SelectProps) {
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
      <div className="relative">
        <select
          id={ids.controlId}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cx(
            controlBase,
            controlBorder(Boolean(error)),
            "h-12 appearance-none pr-10",
            className,
          )}
          {...props}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-fg-muted"
        />
      </div>
    </FieldShell>
  );
}
