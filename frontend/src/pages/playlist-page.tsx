import { Clock3, GripVertical, Play, Shuffle, Trash2 } from "lucide-react";
import { useCallback, useRef, useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";

import { Button } from "../components/common/button";
import { PlaylistCover } from "../components/common/playlist-cover";
import { QueryState } from "../components/common/query-state";
import { SongRow } from "../components/common/song-row";
import { getApiErrorMessage } from "../features/auth/hooks";
import {
  usePlaylistQuery,
  useRemoveSongFromPlaylistMutation,
  useReorderPlaylistMutation,
} from "../features/playlists/hooks";
import { useAuthStore } from "../store/auth.store";
import { usePlayerStore } from "../store/player.store";
import { albumCoverStyle, songToTrack } from "../utils/mappers";
import { cn } from "../utils/cn";
import type { Song } from "../types/api";

export function PlaylistPage(): ReactElement {
  const { id } = useParams();
  const playlist = usePlaylistQuery(id);
  const playSong = usePlayerStore((s) => s.playSong);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const user = useAuthStore((s) => s.user);
  const removeSong = useRemoveSongFromPlaylistMutation();
  const reorder = useReorderPlaylistMutation();

  const data = playlist.data;
  const isOwner = data && user && data.user_id === user.id;
  const tracks = data?.songs.map(songToTrack) ?? [];
  const headerCover = data?.cover_url ?? data?.preview_cover_urls.find(Boolean);

  // --- drag reorder state ---
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const onDragStart = useCallback((idx: number, e: React.DragEvent) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback(
    (idx: number, e: React.DragEvent) => {
      e.preventDefault();
      if (dragIdx === null || idx === dragIdx) return;
      setOverIdx(idx);
    },
    [dragIdx],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIdx === null || overIdx === null || !data || !id) return;
      const songs = [...data.songs];
      const [moved] = songs.splice(dragIdx, 1);
      songs.splice(overIdx, 0, moved);
      const songIds = songs.map((s) => s.id);
      void reorder.mutateAsync({ playlistId: id, songIds });
      setDragIdx(null);
      setOverIdx(null);
    },
    [dragIdx, overIdx, data, id, reorder],
  );

  const onDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  const getVisualOrder = (): Song[] => {
    if (!data) return [];
    if (dragIdx === null || overIdx === null) return data.songs;
    const songs = [...data.songs];
    const [moved] = songs.splice(dragIdx, 1);
    songs.splice(overIdx, 0, moved);
    return songs;
  };

  const orderedSongs = getVisualOrder();

  return (
    <QueryState
      isLoading={playlist.isLoading}
      isError={playlist.isError}
      errorMessage={getApiErrorMessage(playlist.error, "Playlist not found")}
      onRetry={() => void playlist.refetch()}
    >
      {data ? (
        <div>
          <div
            className="mb-6 overflow-hidden rounded-2xl p-6 md:flex md:items-end md:gap-6 md:p-8"
            style={{
              background: `linear-gradient(180deg, rgba(0,0,0,0.35), #121212), ${albumCoverStyle(headerCover, data.id)}`,
            }}
          >
            <PlaylistCover
              coverUrl={data.cover_url}
              songCoverUrls={data.preview_cover_urls}
              seed={data.id}
              className="mb-4 aspect-square w-40 shrink-0 rounded-lg shadow-2xl shadow-black/50 md:mb-0 md:w-52"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ms-muted">
                {data.is_public ? "Public Playlist" : "Private Playlist"}
              </p>
              <h1 className="mt-2 break-words font-display text-3xl font-extrabold sm:text-4xl md:text-6xl">{data.name}</h1>
              <p className="mt-3 max-w-xl text-ms-muted">
                {data.description || "A MusicStream playlist."}
              </p>
              <p className="mt-2 text-sm text-ms-muted">
                {data.owner?.display_name ?? "User"} · {data.song_count} songs
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  disabled={!tracks.length}
                  onClick={() => playSong(tracks[0], { queue: tracks })}
                >
                  <Play size={16} fill="currentColor" />
                  Play
                </Button>
                <Button
                  variant="secondary"
                  disabled={!tracks.length}
                  onClick={() => {
                    toggleShuffle();
                    playSong(tracks[0], { queue: tracks });
                  }}
                >
                  <Shuffle size={16} />
                  Shuffle
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-2 hidden grid-cols-[16px_40px_minmax(0,1fr)_minmax(0,0.8fr)_auto_auto_72px_36px] items-center gap-1 px-2 text-xs uppercase tracking-wide text-ms-muted lg:grid">
            <span />
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span />
            <span />
            <Clock3 size={14} className="justify-self-end" />
            <span />
          </div>

          <QueryState
            isEmpty={!data.songs.length}
            emptyTitle="Empty playlist"
            emptyDescription="Add songs to this playlist to start listening."
          >
            <div className="song-scroll-list rounded-xl bg-ms-surface/30 p-2">
              {orderedSongs.map((song, i) => (
                <div
                  key={song.id}
                  draggable={Boolean(isOwner)}
                  onDragStart={(e) => onDragStart(i, e)}
                  onDragOver={(e) => onDragOver(i, e)}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  className={cn(
                    "group/row flex items-center gap-1 transition",
                    dragIdx === i && "opacity-40",
                    overIdx === i && dragIdx !== null && "border-t-2 border-ms-primary",
                  )}
                >
                  {isOwner ? (
                    <GripVertical
                      size={16}
                      className="shrink-0 cursor-grab text-ms-muted opacity-100 transition sm:opacity-0 sm:group-hover/row:opacity-100"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <SongRow song={song} index={i + 1} queue={data.songs} />
                  </div>
                  {isOwner ? (
                    <button
                      type="button"
                      disabled={removeSong.isPending}
                      onClick={() =>
                        void removeSong.mutateAsync({ playlistId: data.id, songId: song.id })
                      }
                      className="shrink-0 rounded p-1.5 text-ms-muted opacity-100 transition hover:text-red-400 sm:opacity-0 sm:group-hover/row:opacity-100"
                      aria-label={`Remove ${song.title} from playlist`}
                      title="Remove from playlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {removeSong.isError ? (
              <p className="mt-2 text-sm text-red-400">
                {getApiErrorMessage(removeSong.error)}
              </p>
            ) : null}
          </QueryState>
        </div>
      ) : null}
    </QueryState>
  );
}
