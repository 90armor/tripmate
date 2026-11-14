import { cx } from "@/lib/cx";

/**
 * Placeholder block for predictable layouts while content loads (DESIGN_SYSTEM
 * §52). Decorative: pair it with a visually hidden role="status" message.
 * The pulse is disabled by the global reduced-motion rule.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-md bg-border", className)} />;
}
