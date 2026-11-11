import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

export type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
  icon: LucideIcon;
  /** Required accessible name — icon-only controls are otherwise silent to screen readers. */
  label: string;
  variant?: "secondary" | "tertiary";
};

const variants = {
  secondary: "border border-border-strong bg-surface text-fg enabled:hover:bg-background",
  tertiary: "bg-transparent text-fg enabled:hover:bg-action-subtle",
} as const;

/**
 * Icon-only button for familiar secondary actions (close, back, more).
 * Never use for primary actions (DESIGN_SYSTEM §29).
 */
export function IconButton({
  icon: Icon,
  label,
  variant = "tertiary",
  type = "button",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-md",
        "transition-colors duration-(--duration-fast) enabled:active:bg-border",
        "disabled:cursor-not-allowed disabled:text-on-disabled",
        variants[variant],
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" focusable="false" className="size-5" />
    </button>
  );
}
