import { ListMusic, Play, Trash2, X } from "lucide-react";
import type { ReactElement } from "react";

import { cn } from "../../utils/cn";
import { usePlayerStore } from "../../store/player.store";

export function QueuePanel(): ReactElement {
  const open = usePlayerStore((s) => s.isQueueOpen);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const current = usePlayerStore((s) => s.current);
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen);
  const playFromQueue = usePlayerStore((s) => s.playFromQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-black/50 transition",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setQueueOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col border-l border-ms-border bg-ms-surface shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-ms-border px-4 py-4">
          <div className="flex items-center gap-2">
            <ListMusic size={18} className="text-ms-primary" />
            <h2 className="font-display text-lg font-bold">Queue</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearQueue}
              className="rounded-lg px-2 py-1 text-xs text-ms-muted hover:bg-white/5 hover:text-ms-text"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setQueueOpen(false)}
              className="rounded-lg p-2 text-ms-muted hover:bg-white/5 hover:text-ms-text"
              aria-label="Close queue"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {current ? (
            <div className="mb-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-ms-muted">
                Now playing
              </p>
              <div className="flex items-center gap-3 rounded-xl bg-ms-elevated p-3">
                <div className="h-12 w-12 rounded" style={{ background: current.cover }} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ms-primary">{current.title}</p>
                  <p className="truncate text-sm text-ms-muted">{current.artist}</p>
                </div>
              </div>
            </div>
          ) : null}

          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-ms-muted">
            Next up
          </p>
          {queue.length <= 1 ? (
            <p className="px-2 py-8 text-center text-sm text-ms-muted">Queue is empty</p>
          ) : (
            <ul className="space-y-1">
              {queue.map((song, index) => {
                if (index === queueIndex) return null;
                return (
                  <li
                    key={`${song.id}-${index}`}
                    className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => playFromQueue(index)}
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                        <div className="h-full w-full" style={{ background: song.cover }} />
                        <span className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                          <Play size={14} fill="currentColor" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{song.title}</p>
                        <p className="truncate text-xs text-ms-muted">{song.artist}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromQueue(index)}
                      className="rounded p-2 text-ms-muted opacity-0 transition hover:text-ms-text group-hover:opacity-100"
                      aria-label="Remove from queue"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
