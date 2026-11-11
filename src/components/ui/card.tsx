import type { ComponentPropsWithoutRef } from "react";
import { cx } from "@/lib/cx";

export type CardProps = ComponentPropsWithoutRef<"section"> & {
  /** Use `article` for self-contained objects (a trip, a place), `section` for grouped content. */
  as?: "section" | "article" | "div";
};

/**
 * Level 1 content surface (DESIGN_SYSTEM §11, §35): solid, subtle border, no heavy shadow.
 * Use for meaningful grouped objects only — avoid card-inside-card compositions.
 */
export function Card({ as: Element = "section", className, ...props }: CardProps) {
  return (
    <Element
      className={cx("rounded-lg border border-border bg-surface p-4 sm:p-5", className)}
      {...props}
    />
  );
}
