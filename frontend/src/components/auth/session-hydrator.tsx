import type { ReactElement } from "react";

import { useMeQuery } from "../../features/auth/hooks";

/** Hydrates / validates the persisted JWT session via GET /auth/me. */
export function SessionHydrator(): ReactElement | null {
  useMeQuery();
  return null;
}
