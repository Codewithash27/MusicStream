import { useCallback, useEffect, useRef, type ReactElement } from "react";

import { useAuthStore } from "../../store/auth.store";
import { usePlayerStore } from "../../store/player.store";

/** Send accumulated listening time at most this often. */
const FLUSH_INTERVAL_MS = 20_000;
/** Ignore forward jumps larger than this (seeks, not listening). */
const MAX_TICK_SECONDS = 5;

/**
 * Real HTMLAudioElement bridge. Replaces the previous simulated ticker
 * so playback actually produces sound from track audio URLs.
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Listening-time accounting: only real elapsed audio time counts.
  const lastTimeRef = useRef(0);
  const pendingSecondsRef = useRef(0);
  const lastFlushAtRef = useRef(Date.now());
  const trackIdRef = useRef<string | null>(null);

  const flushListening = useCallback(
    (songId: string | null) => {
      const whole = Math.floor(pendingSecondsRef.current);
      if (!songId || !isAuthenticated || whole < 1) return;
      pendingSecondsRef.current -= whole;
      lastFlushAtRef.current = Date.now();
      void import("../../api/library").then(({ libraryApi }) => {
        void libraryApi.reportListening(songId, whole).catch(() => undefined);
      });
    },
    [isAuthenticated],
  );

  // Load / reload source when track or epoch changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    flushListening(trackIdRef.current);
    trackIdRef.current = current?.id ?? null;
    lastTimeRef.current = 0;

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

    // Fire-and-forget play count increment
    if (current.id) {
      void import("../../api/songs").then(({ songsApi }) => {
        void songsApi.play(current.id).catch(() => undefined);
      });
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
      flushListening(trackIdRef.current);
    }
  }, [isPlaying, current?.audioUrl, pause, flushListening]);

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
      lastTimeRef.current = pendingSeek;
    } catch {
      // ignore until metadata ready
    }
    clearPendingSeek();
  }, [pendingSeek, clearPendingSeek]);

  // Flush remaining time when leaving the page
  useEffect(() => {
    const onHide = () => flushListening(trackIdRef.current);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      flushListening(trackIdRef.current);
    };
  }, [flushListening]);

  const onTimeUpdate = (el: HTMLAudioElement) => {
    const now = el.currentTime;
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Count only natural forward progress; skip seeks and rewinds.
    if (delta > 0 && delta <= MAX_TICK_SECONDS && !el.paused) {
      pendingSecondsRef.current += delta;
    }

    if (Date.now() - lastFlushAtRef.current >= FLUSH_INTERVAL_MS) {
      flushListening(trackIdRef.current);
    }

    setPlaybackTime(now);
  };

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      onTimeUpdate={(e) => onTimeUpdate(e.currentTarget)}
      onLoadedMetadata={(e) => {
        const d = e.currentTarget.duration;
        if (Number.isFinite(d) && d > 0) setDurationSeconds(d);
      }}
      onEnded={() => {
        flushListening(trackIdRef.current);
        next();
      }}
      onError={() => pause()}
    />
  );
}
