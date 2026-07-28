import { ListPlus, Pause, Play, Plus } from "lucide-react";
import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import type { Song } from "../../types/api";
import { getApiErrorMessage } from "../../features/auth/hooks";
import { useAddSongToPlaylistMutation, usePlaylistsQuery } from "../../features/playlists/hooks";
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

function isApiSong(item: Song | PlayerTrack): item is Song {
  return "duration_seconds" in item && "artist_id" in item;
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

  const playlists = usePlaylistsQuery({ mine: true, limit: 50 });
  const addToPlaylist = useAddSongToPlaylistMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistMsg, setPlaylistMsg] = useState<string | null>(null);

  const active = current?.id === track.id;
  const apiSong = isApiSong(song) ? song : null;
  const albumLabel =
    "album" in track && track.album
      ? track.album
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

  const onAddToPlaylist = async (playlistId: string) => {
    if (!apiSong) return;
    setPlaylistMsg(null);
    try {
      await addToPlaylist.mutateAsync({ playlistId, songId: apiSong.id });
      setPlaylistMsg("Added to playlist");
      setMenuOpen(false);
    } catch (err) {
      setPlaylistMsg(getApiErrorMessage(err, "Could not add to playlist"));
    }
  };

  return (
    <div
      className={cn(
        "group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/5 md:grid-cols-[40px_1fr_1fr_auto_auto_80px]",
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
        <div className="min-w-0 text-left">
          <Link
            to={`/song/${track.id}`}
            className={cn("block truncate font-medium hover:underline", active && "text-ms-primary")}
          >
            {track.title}
          </Link>
          {apiSong?.artist ? (
            <Link
              to={`/artist/${apiSong.artist.id}`}
              className="block truncate text-sm text-ms-muted hover:underline"
            >
              {track.artist}
            </Link>
          ) : (
            <p className="truncate text-sm text-ms-muted">{track.artist}</p>
          )}
        </div>
      </div>

      {showAlbum ? (
        <p className="hidden truncate text-sm text-ms-muted md:block">{albumLabel || "—"}</p>
      ) : (
        <span className="hidden md:block" />
      )}

      <div className="relative hidden md:block">
        {apiSong ? (
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded p-1.5 text-ms-muted opacity-0 transition hover:text-ms-text group-hover:opacity-100"
            aria-label="Add to playlist"
            title="Add to playlist"
          >
            <ListPlus size={16} />
          </button>
        ) : null}
        {menuOpen && apiSong ? (
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-ms-border bg-ms-elevated p-2 shadow-xl">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ms-muted">
              Your playlists
            </p>
            {playlists.data?.items.length ? (
              playlists.data.items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={addToPlaylist.isPending}
                  onClick={() => void onAddToPlaylist(p.id)}
                  className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10"
                >
                  {p.name}
                </button>
              ))
            ) : (
              <p className="px-2 py-1 text-xs text-ms-muted">Create a playlist in Library first.</p>
            )}
            {playlistMsg ? (
              <p className="mt-1 px-2 text-[11px] text-ms-primary">{playlistMsg}</p>
            ) : null}
          </div>
        ) : null}
      </div>

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
