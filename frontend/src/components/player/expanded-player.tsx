import type { ReactElement } from "react";

import { NowPlayingCard } from "./now-playing-card";

/** Full now-playing card overlay (opened from poster / mini player). */
export function ExpandedPlayer(): ReactElement | null {
  return <NowPlayingCard />;
}
