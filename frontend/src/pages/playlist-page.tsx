import { Clock3, Play, Shuffle } from "lucide-react";
import type { ReactElement } from "react";
import { useParams } from "react-router-dom";

import { Button } from "../components/common/button";
import { QueryState } from "../components/common/query-state";
import { SongRow } from "../components/common/song-row";
import { getApiErrorMessage } from "../features/auth/hooks";
import { usePlaylistQuery } from "../features/playlists/hooks";
import { usePlayerStore } from "../store/player.store";
import { albumCoverStyle, songToTrack } from "../utils/mappers";

export function PlaylistPage(): ReactElement {
  const { id } = useParams();
  const playlist = usePlaylistQuery(id);
  const playSong = usePlayerStore((s) => s.playSong);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  const data = playlist.data;
  const tracks = data?.songs.map(songToTrack) ?? [];

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
              background: `linear-gradient(180deg, rgba(0,0,0,0.35), #121212), ${albumCoverStyle(data.cover_url, data.id)}`,
            }}
          >
            <div
              className="mb-4 aspect-square w-40 shrink-0 rounded-lg shadow-2xl shadow-black/50 md:mb-0 md:w-52"
              style={{ background: albumCoverStyle(data.cover_url, data.id) }}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ms-muted">
                Playlist
              </p>
              <h1 className="mt-2 font-display text-4xl font-extrabold md:text-6xl">{data.name}</h1>
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

          <div className="mb-2 hidden grid-cols-[40px_1fr_1fr_80px] gap-3 px-3 text-xs uppercase tracking-wide text-ms-muted md:grid">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <Clock3 size={14} className="justify-self-end" />
          </div>

          <QueryState
            isEmpty={!data.songs.length}
            emptyTitle="Empty playlist"
            emptyDescription="Add songs to this playlist to start listening."
          >
            <div className="rounded-xl bg-ms-surface/30 p-2">
              {data.songs.map((song, i) => (
                <SongRow key={song.id} song={song} index={i + 1} queue={data.songs} />
              ))}
            </div>
          </QueryState>
        </div>
      ) : null}
    </QueryState>
  );
}
