import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../utils/cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionTo,
  className,
}: SectionHeaderProps): ReactElement {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-ms-muted">{subtitle}</p> : null}
      </div>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="text-sm font-semibold text-ms-muted hover:text-ms-text">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps): ReactElement {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-ms-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
