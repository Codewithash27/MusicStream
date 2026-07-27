import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "../../utils/cn";
import { formatTime } from "../../utils/time";
import { usePlayerStore } from "../../store/player.store";

function progressPct(currentTime: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
}

export function NowPlayingCard(): ReactElement | null {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const isExpanded = usePlayerStore((s) => s.isExpanded);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);
  const setExpanded = usePlayerStore((s) => s.setExpanded);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const open = Boolean(current && isExpanded);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setExpanded]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || duration <= 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      seek(ratio * duration);
    },
    [duration, seek],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    seekFromClientX(e.clientX);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const pct = progressPct(currentTime, duration);

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          className="fixed inset-0 z-55 flex items-end justify-center bg-black/75 p-3 backdrop-blur-md sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={() => setExpanded(false)}
          role="presentation"
        >
          {/* Ambient cover wash */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(ellipse 70% 55% at 50% 35%, rgba(29,185,84,0.28), transparent 65%), ${current.cover}`,
              filter: "blur(48px) saturate(1.2)",
              transform: "scale(1.15)",
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Now playing: ${current.title}`}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-ms-surface shadow-2xl shadow-black/60"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ms-primary">
                Now playing
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    toggleQueue();
                    setExpanded(false);
                  }}
                  className="rounded-full p-2 text-ms-muted transition hover:bg-white/5 hover:text-ms-text"
                  aria-label="Open queue"
                >
                  <ListMusic size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="rounded-full p-2 text-ms-muted transition hover:bg-white/5 hover:text-ms-text"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-5 pt-3">
              <motion.div
                className="aspect-square w-full overflow-hidden rounded-2xl shadow-xl shadow-black/50 ring-1 ring-white/10"
                style={{ background: current.cover }}
                initial={{ opacity: 0.85, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>

            <div className="space-y-5 px-5 pb-6 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-2xl font-bold tracking-tight text-ms-text">
                    {current.title}
                  </h2>
                  <p className="mt-1 truncate text-sm text-ms-muted">{current.artist}</p>
                </div>
                <button
                  type="button"
                  className="mt-1 shrink-0 rounded-full p-2 text-ms-muted transition hover:text-ms-primary"
                  aria-label="Like"
                >
                  <Heart size={20} />
                </button>
              </div>

              <div>
                <div
                  ref={trackRef}
                  className="group relative h-1.5 cursor-pointer touch-none rounded-full bg-white/15"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  role="slider"
                  aria-label="Seek"
                  aria-valuemin={0}
                  aria-valuemax={Math.floor(duration || 0)}
                  aria-valuenow={Math.floor(currentTime)}
                  tabIndex={0}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-ms-primary"
                    style={{ width: `${pct}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-ms-text opacity-0 shadow transition group-hover:opacity-100"
                    style={{ left: `calc(${pct}% - 7px)` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] tabular-nums text-ms-muted">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={cn(
                    "rounded-full p-2 transition hover:scale-105",
                    shuffle ? "text-ms-primary" : "text-ms-muted hover:text-ms-text",
                  )}
                  aria-label="Shuffle"
                  aria-pressed={shuffle}
                >
                  <Shuffle size={18} />
                </button>
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-full p-2 text-ms-text transition hover:scale-105 hover:text-white"
                  aria-label="Previous"
                >
                  <SkipBack size={26} fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-ms-primary text-black shadow-lg shadow-ms-primary/25 transition hover:scale-105 hover:bg-ms-primary-hover"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause size={26} fill="currentColor" />
                  ) : (
                    <Play size={26} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full p-2 text-ms-text transition hover:scale-105 hover:text-white"
                  aria-label="Next"
                >
                  <SkipForward size={26} fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={cycleRepeat}
                  className={cn(
                    "rounded-full p-2 transition hover:scale-105",
                    repeat !== "off" ? "text-ms-primary" : "text-ms-muted hover:text-ms-text",
                  )}
                  aria-label={`Repeat ${repeat}`}
                  aria-pressed={repeat !== "off"}
                >
                  {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
