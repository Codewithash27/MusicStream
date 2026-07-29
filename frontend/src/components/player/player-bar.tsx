import {
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { ReactElement } from "react";

import { cn } from "../../utils/cn";
import { usePlayerStore } from "../../store/player.store";
import { LikeButton } from "../common/like-button";
import { SeekBar } from "./seek-bar";
import { VolumeControl } from "./volume-control";

export function PlayerBar(): ReactElement | null {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);
  const setExpanded = usePlayerStore((s) => s.setExpanded);

  if (!current) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#181818]/95 backdrop-blur">
      {/* Mobile mini player */}
      <div className="md:hidden">
        <SeekBar
          className="px-0"
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          showTimes={false}
        />
        <div className="flex items-center gap-3 px-3 py-2">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            onClick={() => setExpanded(true)}
            aria-label="Open now playing card"
          >
            <div
              className="h-12 w-12 shrink-0 overflow-hidden rounded"
              style={{ background: current.cover }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{current.title}</p>
              <p className="truncate text-xs text-ms-muted">{current.artist}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={toggleQueue}
            className={cn("p-2", isQueueOpen ? "text-ms-primary" : "text-ms-muted")}
            aria-label="Queue"
          >
            <ListMusic size={18} />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="rounded-full bg-ms-text p-2 text-black"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop full bar */}
      <div className="mx-auto hidden h-[90px] max-w-[1800px] grid-cols-[1fr_2fr_1fr] items-center gap-4 px-4 md:grid">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="h-14 w-14 shrink-0 overflow-hidden rounded ring-offset-2 ring-offset-[#181818] transition hover:ring-2 hover:ring-ms-primary"
            style={{ background: current.cover }}
            aria-label="Open now playing card"
            title="Open player card"
          />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-w-0 text-left"
          >
            <p className="truncate text-sm font-semibold hover:underline">{current.title}</p>
            <p className="truncate text-xs text-ms-muted">{current.artist}</p>
          </button>
          <LikeButton songId={current.id} className="ml-1" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleShuffle}
              className={cn(
                "transition hover:scale-105",
                shuffle ? "text-ms-primary" : "text-ms-muted hover:text-ms-text",
              )}
              aria-label="Toggle shuffle"
              aria-pressed={shuffle}
            >
              <Shuffle size={16} />
            </button>
            <button
              type="button"
              onClick={prev}
              className="text-ms-muted transition hover:scale-105 hover:text-ms-text"
              aria-label="Previous"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ms-text text-black transition hover:scale-105"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              className="text-ms-muted transition hover:scale-105 hover:text-ms-text"
              aria-label="Next"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={cn(
                "transition hover:scale-105",
                repeat !== "off" ? "text-ms-primary" : "text-ms-muted hover:text-ms-text",
              )}
              aria-label={`Repeat ${repeat}`}
              aria-pressed={repeat !== "off"}
            >
              {repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>
          <SeekBar currentTime={currentTime} duration={duration} onSeek={seek} className="max-w-xl" />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={toggleQueue}
            className={cn(
              "transition hover:scale-105",
              isQueueOpen ? "text-ms-primary" : "text-ms-muted hover:text-ms-text",
            )}
            aria-label="Toggle queue"
            aria-pressed={isQueueOpen}
          >
            <ListMusic size={18} />
          </button>
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}
