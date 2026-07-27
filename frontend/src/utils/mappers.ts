import type { Song } from "../types/api";
import { resolveMediaUrl } from "./media-url";
import { formatTime } from "./time";

const FALLBACK_COVERS = [
  "linear-gradient(135deg,#1db954,#0a3d22)",
  "linear-gradient(135deg,#3b82f6,#0f172a)",
  "linear-gradient(135deg,#f43f5e,#1f0a12)",
  "linear-gradient(135deg,#a855f7,#1e1033)",
  "linear-gradient(135deg,#f59e0b,#3b1d05)",
  "linear-gradient(135deg,#14b8a6,#042f2e)",
];

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
  audioUrl?: string;
  plays?: string;
};

export function coverFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * 17) % FALLBACK_COVERS.length;
  return FALLBACK_COVERS[Math.abs(hash) % FALLBACK_COVERS.length];
}

export function songToTrack(song: Song): PlayerTrack {
  const cover = resolveMediaUrl(song.cover_url);
  return {
    id: song.id,
    title: song.title,
    artist: song.artist?.stage_name ?? "Unknown Artist",
    album: "",
    duration: formatTime(song.duration_seconds),
    cover: cover
      ? `center / cover url("${cover}")`
      : coverFromSeed(song.id),
    audioUrl: resolveMediaUrl(song.audio_url),
    plays: String(song.play_count),
  };
}

export function albumCoverStyle(coverUrl: string | null | undefined, seed: string): string {
  const resolved = resolveMediaUrl(coverUrl);
  return resolved ? `center / cover url("${resolved}")` : coverFromSeed(seed);
}
