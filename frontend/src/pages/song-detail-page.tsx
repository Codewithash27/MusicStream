import { ImagePlus, Play } from "lucide-react";
import {
  type ChangeEvent,
  type ReactElement,
  useId,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

import { getApiErrorMessage } from "../api/client";
import { Button } from "../components/common/button";
import { QueryState } from "../components/common/query-state";
import { useSongQuery, useUploadSongCoverMutation } from "../features/songs/hooks";
import { useAuthStore } from "../store/auth.store";
import { usePlayerStore } from "../store/player.store";
import { albumCoverStyle, coverFromSeed, songToTrack } from "../utils/mappers";
import { formatTime } from "../utils/time";

const MAX_COVER_BYTES = 5 * 1024 * 1024;

export function SongDetailPage(): ReactElement {
  const { id } = useParams();
  const songQuery = useSongQuery(id);
  const playSong = usePlayerStore((s) => s.playSong);
  const user = useAuthStore((s) => s.user);
  const uploadCover = useUploadSongCoverMutation();
  const coverInputId = useId();
  const coverRef = useRef<HTMLInputElement>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverOk, setCoverOk] = useState<string | null>(null);

  const song = songQuery.data;
  const canEditCover =
    Boolean(user) && (user?.role === "ARTIST" || user?.role === "ADMIN");

  const onCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setCoverError(null);
    setCoverOk(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !song) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCoverError("Cover must be JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setCoverError("Cover must be under 5MB.");
      return;
    }
    try {
      await uploadCover.mutateAsync({ songId: song.id, cover: file });
      setCoverOk("Cover updated.");
    } catch (err) {
      setCoverError(getApiErrorMessage(err, "Cover upload failed"));
    }
  };

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
            <div className="relative w-full max-w-xs shrink-0">
              <div
                className="aspect-square w-full rounded-2xl shadow-2xl ring-1 ring-white/10"
                style={{
                  background: song.cover_url
                    ? albumCoverStyle(song.cover_url, song.id)
                    : coverFromSeed(song.id),
                }}
              />
              {canEditCover ? (
                <div className="mt-3">
                  <input
                    ref={coverRef}
                    id={coverInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => void onCoverChange(e)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploadCover.isPending}
                    onClick={() => coverRef.current?.click()}
                  >
                    <ImagePlus size={14} />
                    {uploadCover.isPending ? "Uploading…" : "Update cover"}
                  </Button>
                  {coverError ? (
                    <p className="mt-2 text-sm text-ms-danger">{coverError}</p>
                  ) : null}
                  {coverOk ? (
                    <p className="mt-2 text-sm text-ms-primary">{coverOk}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
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
