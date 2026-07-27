import { AlertTriangle } from "lucide-react";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("UI ErrorBoundary caught:", error, info);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ms-bg p-6 text-ms-text">
          <div className="max-w-md rounded-2xl border border-ms-border bg-ms-surface p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 text-ms-primary" size={38} />
            <h1 className="mb-2 font-display text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-ms-muted">
              MusicStream hit an unexpected error. Please refresh this page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
