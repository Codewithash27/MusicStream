import { Play } from "lucide-react";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "../components/common/button";
import { QueryState } from "../components/common/query-state";
import { SongRow } from "../components/common/song-row";
import { getApiErrorMessage } from "../features/auth/hooks";
import { useAlbumQuery } from "../features/albums/hooks";
import { usePlayerStore } from "../store/player.store";
import { albumCoverStyle, songToTrack } from "../utils/mappers";

export function AlbumPage(): ReactElement {
  const { id } = useParams();
  const album = useAlbumQuery(id);
  const playSong = usePlayerStore((s) => s.playSong);
  const data = album.data;
  const tracks = data?.songs.map(songToTrack) ?? [];

  return (
    <QueryState
      isLoading={album.isLoading}
      isError={album.isError}
      errorMessage={getApiErrorMessage(album.error, "Album not found")}
      onRetry={() => void album.refetch()}
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
              className="mb-4 aspect-square w-40 shrink-0 rounded-lg shadow-2xl md:mb-0 md:w-52"
              style={{ background: albumCoverStyle(data.cover_url, data.id) }}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ms-muted">Album</p>
              <h1 className="mt-2 font-display text-4xl font-extrabold md:text-6xl">{data.title}</h1>
              <p className="mt-3 text-sm">
                {data.artist ? (
                  <Link to={`/artist/${data.artist.id}`} className="font-semibold hover:underline">
                    {data.artist.stage_name}
                  </Link>
                ) : (
                  <span className="font-semibold">Unknown</span>
                )}
                <span className="text-ms-muted">
                  {" "}
                  · {data.release_date?.slice(0, 4) ?? "—"} · {data.track_count} songs
                </span>
              </p>
              <div className="mt-6">
                <Button
                  disabled={!tracks.length}
                  onClick={() => playSong(tracks[0], { queue: tracks })}
                >
                  <Play size={16} fill="currentColor" />
                  Play
                </Button>
              </div>
            </div>
          </div>

          <QueryState
            isEmpty={!data.songs.length}
            emptyTitle="No tracks on this album"
            emptyDescription="Songs linked to this album will appear here."
          >
            <div className="rounded-xl bg-ms-surface/30 p-2">
              {data.songs.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={i + 1}
                  showAlbum={false}
                  queue={data.songs}
                />
              ))}
            </div>
          </QueryState>
        </div>
      ) : null}
    </QueryState>
  );
}
