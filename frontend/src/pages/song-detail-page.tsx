import { Play } from "lucide-react";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "../components/common/button";
import { QueryState } from "../components/common/query-state";
import { getApiErrorMessage } from "../features/auth/hooks";
import { useSongQuery } from "../features/songs/hooks";
import { usePlayerStore } from "../store/player.store";
import { albumCoverStyle, coverFromSeed, songToTrack } from "../utils/mappers";
import { formatTime } from "../utils/time";

export function SongDetailPage(): ReactElement {
  const { id } = useParams();
  const songQuery = useSongQuery(id);
  const playSong = usePlayerStore((s) => s.playSong);
  const song = songQuery.data;

  return (
    <div>
      <QueryState
        isLoading={songQuery.isLoading}
        isError={songQuery.isError}
        errorMessage={getApiErrorMessage(songQuery.error, "Song not found")}
        onRetry={() => void songQuery.refetch()}
        isEmpty={!songQuery.isLoading && !song}
        emptyTitle="Song not found"
      >
        {song ? (
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <div
              className="aspect-square w-full max-w-xs shrink-0 rounded-2xl shadow-2xl ring-1 ring-white/10"
              style={{
                background: song.cover_url
                  ? albumCoverStyle(song.cover_url, song.id)
                  : coverFromSeed(song.id),
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-ms-muted">Song</p>
              <h1 className="mt-2 font-display text-4xl font-extrabold md:text-5xl">{song.title}</h1>
              <p className="mt-3 text-ms-muted">
                {song.artist ? (
                  <Link to={`/artist/${song.artist.id}`} className="hover:underline">
                    {song.artist.stage_name}
                  </Link>
                ) : (
                  "Unknown artist"
                )}{" "}
                · {formatTime(song.duration_seconds)} · {song.play_count.toLocaleString()} plays
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => playSong(songToTrack(song), { queue: [songToTrack(song)] })}>
                  <Play size={16} fill="currentColor" />
                  Play
                </Button>
                <Link to="/home">
                  <Button variant="secondary">Back to Home</Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
