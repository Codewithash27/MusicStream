import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { Button } from "./button";
import { EmptyState } from "./empty-state";

interface QueryStateProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  children: ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  isEmpty,
  errorMessage = "Failed to load data",
  emptyTitle = "Nothing here yet",
  emptyDescription = "Try again later or adjust your filters.",
  onRetry,
  children,
}: QueryStateProps): ReactElement {
  if (isLoading) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-ms-muted">
        <Loader2 className="animate-spin text-ms-primary" size={28} />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={32} />}
        title="Something went wrong"
        description={errorMessage}
        action={
          onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Inbox size={32} />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return <>{children}</>;
}
