import { Pause, Play, Plus } from "lucide-react";
import type { ReactElement } from "react";

import type { Song } from "../../types/api";
import { cn } from "../../utils/cn";
import { songToTrack, type PlayerTrack } from "../../utils/mappers";
import { usePlayerStore } from "../../store/player.store";

interface SongRowProps {
  song: Song | PlayerTrack;
  index?: number;
  showAlbum?: boolean;
  queue?: Array<Song | PlayerTrack>;
}

function toTrack(item: Song | PlayerTrack): PlayerTrack {
  return "duration_seconds" in item ? songToTrack(item) : item;
}

export function SongRow({
  song,
  index,
  showAlbum = true,
  queue,
}: SongRowProps): ReactElement {
  const track = toTrack(song);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playSong = usePlayerStore((s) => s.playSong);
  const toggle = usePlayerStore((s) => s.toggle);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const setExpanded = usePlayerStore((s) => s.setExpanded);

  const active = current?.id === track.id;
  const albumLabel =
    "album" in track && track.album
      ? track.album
      : "duration_seconds" in song
        ? ""
        : "";

  const ensurePlaying = () => {
    const mappedQueue = (queue ?? [song]).map(toTrack);
    if (!active) playSong(track, { queue: mappedQueue });
  };

  const play = () => {
    const mappedQueue = (queue ?? [song]).map(toTrack);
    if (active) toggle();
    else playSong(track, { queue: mappedQueue });
  };

  const openCard = () => {
    ensurePlaying();
    setExpanded(true);
  };

  return (
    <div
      className={cn(
        "group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/5 md:grid-cols-[40px_1fr_1fr_auto_80px]",
        active && "bg-white/5 text-ms-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={play}
          className="flex h-10 w-8 items-center justify-center text-sm text-ms-muted"
          aria-label={active && isPlaying ? "Pause" : "Play"}
        >
          {active && isPlaying ? (
            <Pause size={16} className="text-ms-primary" fill="currentColor" />
          ) : active ? (
            <Play size={16} className="text-ms-primary" fill="currentColor" />
          ) : (
            <>
              <span className="hidden md:inline">{index ?? "•"}</span>
              <Play size={16} className="text-ms-muted md:hidden" fill="currentColor" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={openCard}
          className="h-10 w-10 shrink-0 overflow-hidden rounded ring-offset-2 ring-offset-ms-bg transition hover:ring-2 hover:ring-ms-primary md:hidden"
          style={{ background: track.cover }}
          aria-label={`Open now playing for ${track.title}`}
        />
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openCard}
          className="hidden h-10 w-10 shrink-0 overflow-hidden rounded ring-offset-2 ring-offset-ms-bg transition hover:ring-2 hover:ring-ms-primary md:block"
          style={{ background: track.cover }}
          aria-label={`Open now playing for ${track.title}`}
          title="Open player card"
        />
        <button type="button" onClick={play} className="min-w-0 text-left">
          <p className={cn("truncate font-medium", active && "text-ms-primary")}>{track.title}</p>
          <p className="truncate text-sm text-ms-muted">{track.artist}</p>
        </button>
      </div>

      {showAlbum ? (
        <p className="hidden truncate text-sm text-ms-muted md:block">{albumLabel || "—"}</p>
      ) : (
        <span className="hidden md:block" />
      )}

      <button
        type="button"
        onClick={() => addToQueue(track)}
        className="hidden rounded p-1.5 text-ms-muted opacity-0 transition hover:text-ms-text group-hover:opacity-100 md:inline-flex"
        aria-label="Add to queue"
        title="Add to queue"
      >
        <Plus size={16} />
      </button>

      <span className="text-sm text-ms-muted tabular-nums">{track.duration}</span>
    </div>
  );
}
