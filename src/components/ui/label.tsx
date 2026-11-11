import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

export type LabelProps = ComponentProps<"label"> & { htmlFor: string };

/** Visible form label. `htmlFor` is required so every label is tied to a control. */
export function Label({ className, htmlFor, ...props }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx("text-small font-medium text-fg", className)}
      {...props}
    />
  );
}
