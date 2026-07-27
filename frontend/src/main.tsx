import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { queryClient } from "./api/query-client";
import { ErrorBoundary } from "./components/common/error-boundary";
import { useTheme } from "./hooks/use-theme";
import "./styles/index.css";

function Boot(): ReactElement {
  useTheme();
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Boot />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
