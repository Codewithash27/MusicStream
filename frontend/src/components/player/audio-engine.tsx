import { useEffect, useRef, type ReactElement } from "react";

import { usePlayerStore } from "../../store/player.store";

/**
 * Real HTMLAudioElement bridge. Replaces the previous simulated ticker
 * so playback actually produces sound from backend /media URLs.
 */
export function AudioEngine(): ReactElement {
  const audioRef = useRef<HTMLAudioElement>(null);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const pendingSeek = usePlayerStore((s) => s.pendingSeek);
  const playbackEpoch = usePlayerStore((s) => s.playbackEpoch);
  const next = usePlayerStore((s) => s.next);
  const pause = usePlayerStore((s) => s.pause);
  const setPlaybackTime = usePlayerStore((s) => s.setPlaybackTime);
  const setDurationSeconds = usePlayerStore((s) => s.setDurationSeconds);
  const clearPendingSeek = usePlayerStore((s) => s.clearPendingSeek);

  // Load / reload source when track or epoch changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!current?.audioUrl) {
      el.removeAttribute("src");
      el.load();
      return;
    }

    if (el.src !== current.audioUrl) {
      el.src = current.audioUrl;
      el.load();
    } else {
      el.currentTime = 0;
    }

    if (isPlaying) {
      void el.play().catch(() => pause());
    }
    // intentionally only when track identity / epoch changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.audioUrl, playbackEpoch]);

  // Play / pause
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current?.audioUrl) return;
    if (isPlaying) {
      void el.play().catch(() => pause());
    } else {
      el.pause();
    }
  }, [isPlaying, current?.audioUrl, pause]);

  // Volume / mute
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted]);

  // Seek requests from UI
  useEffect(() => {
    const el = audioRef.current;
    if (!el || pendingSeek == null) return;
    try {
      el.currentTime = pendingSeek;
    } catch {
      // ignore until metadata ready
    }
    clearPendingSeek();
  }, [pendingSeek, clearPendingSeek]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => {
        const d = e.currentTarget.duration;
        if (Number.isFinite(d) && d > 0) setDurationSeconds(d);
      }}
      onEnded={() => next()}
      onError={() => pause()}
    />
  );
}
