import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";

export function ProtectedRoute(): ReactElement {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
