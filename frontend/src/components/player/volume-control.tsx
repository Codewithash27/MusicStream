import { Volume1, Volume2, VolumeX } from "lucide-react";
import type { ReactElement } from "react";

import { usePlayerStore } from "../../store/player.store";

export function VolumeControl(): ReactElement {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const level = muted ? 0 : volume;
  const pct = level * 100;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleMute}
        className="text-ms-muted transition hover:text-ms-text"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        <Icon size={18} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={level}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volume"
        className="player-range h-1 w-24 cursor-pointer"
        style={{
          background: `linear-gradient(to right, #fff ${pct}%, #4d4d4d ${pct}%)`,
        }}
      />
    </div>
  );
}
