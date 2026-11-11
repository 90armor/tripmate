import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "default" | "large";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  /** `large` (48px) is for frequent travel-time actions (DESIGN_SYSTEM §22). */
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 font-semibold select-none " +
  "transition-[background-color,color,transform] duration-(--duration-fast) " +
  "enabled:active:scale-98 " +
  "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled disabled:text-on-disabled";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-action text-on-action enabled:hover:bg-action-hover enabled:active:bg-action-pressed",
  secondary:
    "border border-border-strong bg-surface text-fg enabled:hover:bg-background enabled:active:bg-border",
  tertiary:
    "bg-transparent text-action enabled:hover:bg-action-subtle enabled:active:bg-action-subtle",
  danger: "bg-danger text-on-status enabled:hover:bg-danger-hover enabled:active:bg-danger-pressed",
};

const sizes: Record<ButtonSize, string> = {
  default: "min-h-11 text-body", // 44px minimum touch target
  large: "min-h-12 text-body-lg", // 48px preferred for frequent actions
};

export function Button({
  variant = "primary",
  size = "default",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
