import type { ReactElement, ReactNode } from "react";

import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ms-border bg-ms-surface/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 text-ms-primary">{icon}</div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ms-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
