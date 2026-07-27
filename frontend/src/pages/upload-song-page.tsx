import { CheckCircle2, ImagePlus, Music2, UploadCloud, X } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useId,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { getApiErrorMessage } from "../api/client";
import { Button } from "../components/common/button";
import { Input } from "../components/common/input";
import { PageHeader } from "../components/common/section-header";
import { useUploadSongMutation } from "../features/songs/hooks";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadSongPage(): ReactElement {
  const navigate = useNavigate();
  const upload = useUploadSongMutation();
  const audioInputId = useId();
  const coverInputId = useId();

  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("210");
  const [trackNumber, setTrackNumber] = useState("1");
  const [localError, setLocalError] = useState<string | null>(null);
  const [doneTitle, setDoneTitle] = useState<string | null>(null);

  const onAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    setDoneTitle(null);
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".mp3") && file.type !== "audio/mpeg") {
      setLocalError("Please choose an MP3 file.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setLocalError(`Audio must be under 20MB (got ${formatBytes(file.size)}).`);
      return;
    }
    setAudio(file);
    if (!title.trim()) {
      const base = file.name.replace(/\.mp3$/i, "").replace(/^\d+\s*/, "");
      setTitle(base.slice(0, 255));
    }
  };

  const onCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Cover must be an image (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setLocalError(`Cover must be under 5MB (got ${formatBytes(file.size)}).`);
      return;
    }
    setCover(file);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearCover = () => {
    setCover(null);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setDoneTitle(null);

    if (!audio) {
      setLocalError("Choose an MP3 file to upload.");
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setLocalError("Title is required.");
      return;
    }
    const duration = Number(durationSeconds);
    if (!Number.isFinite(duration) || duration < 1 || duration > 86_400) {
      setLocalError("Duration must be between 1 and 86400 seconds.");
      return;
    }
    const track = trackNumber.trim() ? Number(trackNumber) : undefined;
    if (track != null && (!Number.isFinite(track) || track < 1 || track > 999)) {
      setLocalError("Track number must be between 1 and 999.");
      return;
    }

    try {
      const song = await upload.mutateAsync({
        title: trimmedTitle,
        duration_seconds: Math.floor(duration),
        track_number: track,
        audio,
        cover,
      });
      setDoneTitle(song.title);
      setAudio(null);
      clearCover();
      setTitle("");
      setDurationSeconds("210");
      setTrackNumber("1");
    } catch {
      // surfaced via upload.error / local message
    }
  };

  const errorMessage =
    localError ||
    (upload.isError ? getApiErrorMessage(upload.error, "Upload failed") : null);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Upload song"
        subtitle="Share your track with the MusicStream audience."
      />

      <form
        className="space-y-6 rounded-2xl border border-ms-border bg-ms-surface p-6 md:p-8"
        onSubmit={(e) => void onSubmit(e)}
      >
        <label
          htmlFor={audioInputId}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-ms-border bg-ms-elevated/50 px-6 py-12 text-center transition hover:border-ms-primary"
        >
          <UploadCloud className="mb-3 text-ms-primary" size={36} />
          {audio ? (
            <>
              <p className="font-semibold text-ms-text">{audio.name}</p>
              <p className="mt-1 text-sm text-ms-muted">{formatBytes(audio.size)} · click to change</p>
            </>
          ) : (
            <>
              <p className="font-semibold">Drop your MP3 here</p>
              <p className="mt-1 text-sm text-ms-muted">or click to browse · max 20MB</p>
            </>
          )}
          <input
            id={audioInputId}
            type="file"
            accept="audio/mpeg,.mp3"
            className="hidden"
            onChange={onAudioChange}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div className="relative">
            <label
              htmlFor={coverInputId}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-ms-border bg-ms-elevated/50 text-center hover:border-ms-primary"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="mb-2 text-ms-muted" size={28} />
                  <span className="text-xs text-ms-muted">Cover art</span>
                </>
              )}
              <input
                id={coverInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="hidden"
                onChange={onCoverChange}
              />
            </label>
            {cover ? (
              <button
                type="button"
                onClick={clearCover}
                className="absolute -right-2 -top-2 rounded-full bg-ms-elevated p-1 text-ms-muted ring-1 ring-ms-border hover:text-ms-text"
                aria-label="Remove cover"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
          <div className="space-y-4">
            <Input
              label="Title"
              name="title"
              placeholder="Song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Duration (seconds)"
              name="duration_seconds"
              type="number"
              min={1}
              max={86400}
              placeholder="210"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              required
            />
            <Input
              label="Track number"
              name="track_number"
              type="number"
              min={1}
              max={999}
              placeholder="1"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
            />
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-ms-danger/40 bg-ms-danger/10 px-4 py-3 text-sm text-ms-danger">
            {errorMessage}
          </div>
        ) : null}

        {doneTitle ? (
          <div className="flex items-start gap-3 rounded-xl bg-ms-primary/10 px-4 py-3 text-sm text-ms-primary">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-medium">“{doneTitle}” uploaded successfully.</p>
              <button
                type="button"
                className="mt-1 underline underline-offset-2 hover:text-ms-primary-hover"
                onClick={() => navigate("/home")}
              >
                View on Home
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl bg-ms-elevated p-4 text-sm text-ms-muted">
            <Music2 className="mt-0.5 shrink-0 text-ms-primary" size={18} />
            MP3 required · ARTIST or ADMIN only · max 20MB audio
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate("/home")}>
            Cancel
          </Button>
          <Button type="submit" disabled={upload.isPending || !audio}>
            {upload.isPending ? "Uploading…" : "Publish track"}
          </Button>
        </div>
      </form>
    </div>
  );
}
