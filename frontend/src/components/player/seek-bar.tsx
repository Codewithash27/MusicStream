import type { ReactElement } from "react";

import { cn } from "../../utils/cn";
import { formatTime } from "../../utils/time";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  className?: string;
  showTimes?: boolean;
}

export function SeekBar({
  currentTime,
  duration,
  onSeek,
  className,
  showTimes = true,
}: SeekBarProps): ReactElement {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      {showTimes ? (
        <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-ms-muted">
          {formatTime(currentTime)}
        </span>
      ) : null}
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Seek"
        className="player-range h-1 w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, #1db954 ${pct}%, #4d4d4d ${pct}%)`,
        }}
      />
      {showTimes ? (
        <span className="w-9 shrink-0 text-[11px] tabular-nums text-ms-muted">
          {formatTime(duration)}
        </span>
      ) : null}
    </div>
  );
}
