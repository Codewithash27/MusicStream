import type { ReactElement } from "react";

import { usePlayerStore } from "../../store/player.store";
import { AudioEngine } from "./audio-engine";
import { ExpandedPlayer } from "./expanded-player";
import { PlayerBar } from "./player-bar";
import { QueuePanel } from "./queue-panel";

/** Global player host — mount once at app root so state survives route changes. */
export function PlayerRoot(): ReactElement | null {
  const current = usePlayerStore((s) => s.current);

  return (
    <>
      <AudioEngine />
      {current ? (
        <>
          <PlayerBar />
          <ExpandedPlayer />
          <QueuePanel />
        </>
      ) : null}
    </>
  );
}
