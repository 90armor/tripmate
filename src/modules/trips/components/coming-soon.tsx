import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Intentional empty state for a workspace destination that is not built yet
 * (ROADMAP D17, DESIGN_SYSTEM §51): says what will live here. It offers no
 * action, so nothing appears to work that cannot. Each one must be replaced by
 * its real module before production release.
 */
export function ComingSoon({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 font-semibold tracking-tight">{title}</h1>
      {children}
      <section
        aria-label={`${title}: not available yet`}
        className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border-strong bg-surface p-5"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-action-subtle text-action">
          <Icon aria-hidden className="size-5" />
        </span>
        <p className="text-small font-semibold tracking-wide text-fg-secondary uppercase">
          Coming soon
        </p>
        <p className="max-w-prose text-body-lg text-fg-secondary">{description}</p>
      </section>
    </div>
  );
}
