import { CircleAlert } from "lucide-react";
import { cx } from "@/lib/cx";

/**
 * Form-level error (DESIGN_SYSTEM §54). role="alert" announces it when it
 * appears; the icon and text mean colour is never the only signal.
 */
export function FormAlert({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cx(
        "flex items-start gap-2 rounded-md border border-danger bg-surface p-3 text-body text-danger",
        className,
      )}
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
