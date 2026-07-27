import { create } from "zustand";

import type { PlayerTrack } from "../utils/mappers";
import { clamp, parseDuration } from "../utils/time";

export type RepeatMode = "off" | "all" | "one";

interface PlayOptions {
  queue?: PlayerTrack[];
  startIndex?: number;
}

interface PlayerState {
  current: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  previousVolume: number;
  currentTime: number;
  duration: number;
  pendingSeek: number | null;
  playbackEpoch: number;
  isQueueOpen: boolean;
  isExpanded: boolean;
  shuffleOrder: number[];

  playSong: (song: PlayerTrack, options?: PlayOptions) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: PlayerTrack) => void;
  removeFromQueue: (index: number) => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
  setQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
  setExpanded: (open: boolean) => void;
  /** Sync from HTMLAudioElement timeupdate (real playback). */
  setPlaybackTime: (seconds: number) => void;
  setDurationSeconds: (seconds: number) => void;
  clearPendingSeek: () => void;
}

function buildShuffleOrder(length: number, currentIndex: number): number[] {
  const rest = Array.from({ length }, (_, i) => i).filter((i) => i !== currentIndex);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [currentIndex, ...rest];
}

function loadTrack(song: PlayerTrack) {
  return {
    current: song,
    currentTime: 0,
    duration: parseDuration(song.duration),
    isPlaying: true,
    pendingSeek: 0 as number | null,
    playbackEpoch: Date.now(),
  };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  shuffle: false,
  repeat: "off",
  volume: 0.7,
  muted: false,
  previousVolume: 0.7,
  currentTime: 0,
  duration: 0,
  pendingSeek: null,
  playbackEpoch: 0,
  isQueueOpen: false,
  isExpanded: false,
  shuffleOrder: [],

  playSong: (song, options) => {
    const queue = options?.queue?.length
      ? [...options.queue]
      : get().queue.length
        ? get().queue
        : [song];
    let index = options?.startIndex;
    if (index == null) {
      index = queue.findIndex((s) => s.id === song.id);
      if (index < 0) {
        queue.unshift(song);
        index = 0;
      }
    }
    const shuffleOrder = get().shuffle ? buildShuffleOrder(queue.length, index) : [];
    set({
      queue,
      queueIndex: index,
      shuffleOrder,
      ...loadTrack(queue[index]),
    });
  },

  play: () => {
    if (!get().current) return;
    set({ isPlaying: true });
  },

  pause: () => set({ isPlaying: false }),

  toggle: () => {
    if (!get().current) return;
    set({ isPlaying: !get().isPlaying });
  },

  next: () => {
    const { queue, queueIndex, shuffle, shuffleOrder, repeat, current } = get();
    if (!queue.length || !current) return;

    if (repeat === "one") {
      set({ ...loadTrack(current) });
      return;
    }

    let nextIndex: number | null = null;

    if (shuffle && shuffleOrder.length) {
      const pos = shuffleOrder.indexOf(queueIndex);
      if (pos >= 0 && pos < shuffleOrder.length - 1) {
        nextIndex = shuffleOrder[pos + 1];
      } else if (repeat === "all") {
        const order = buildShuffleOrder(queue.length, queueIndex);
        nextIndex = order[1] ?? order[0];
        set({ shuffleOrder: order });
      }
    } else if (queueIndex < queue.length - 1) {
      nextIndex = queueIndex + 1;
    } else if (repeat === "all") {
      nextIndex = 0;
    }

    if (nextIndex == null) {
      set({ isPlaying: false, currentTime: get().duration });
      return;
    }

    set({
      queueIndex: nextIndex,
      ...loadTrack(queue[nextIndex]),
    });
  },

  prev: () => {
    const { queue, queueIndex, shuffle, shuffleOrder, currentTime, current } = get();
    if (!queue.length || !current) return;

    if (currentTime > 3) {
      set({ currentTime: 0, pendingSeek: 0 });
      return;
    }

    let prevIndex: number | null = null;
    if (shuffle && shuffleOrder.length) {
      const pos = shuffleOrder.indexOf(queueIndex);
      if (pos > 0) prevIndex = shuffleOrder[pos - 1];
    } else if (queueIndex > 0) {
      prevIndex = queueIndex - 1;
    }

    if (prevIndex == null) {
      set({ currentTime: 0, pendingSeek: 0 });
      return;
    }

    set({
      queueIndex: prevIndex,
      ...loadTrack(queue[prevIndex]),
    });
  },

  seek: (seconds) => {
    const duration = get().duration;
    const next = clamp(seconds, 0, duration || Number.MAX_SAFE_INTEGER);
    set({ currentTime: next, pendingSeek: next });
  },

  setPlaybackTime: (seconds) => {
    if (get().pendingSeek != null) return;
    set({ currentTime: Math.max(0, seconds) });
  },

  setDurationSeconds: (seconds) => {
    if (Number.isFinite(seconds) && seconds > 0) {
      set({ duration: seconds });
    }
  },

  clearPendingSeek: () => set({ pendingSeek: null }),

  setVolume: (volume) => {
    const next = clamp(volume, 0, 1);
    set({
      volume: next,
      muted: next === 0,
      previousVolume: next > 0 ? next : get().previousVolume,
    });
  },

  toggleMute: () => {
    const { muted, volume, previousVolume } = get();
    if (muted || volume === 0) {
      set({ muted: false, volume: previousVolume || 0.7 });
    } else {
      set({ muted: true, previousVolume: volume, volume: 0 });
    }
  },

  toggleShuffle: () => {
    const { shuffle, queue, queueIndex } = get();
    const next = !shuffle;
    set({
      shuffle: next,
      shuffleOrder: next && queue.length ? buildShuffleOrder(queue.length, queueIndex) : [],
    });
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    const idx = order.indexOf(get().repeat);
    set({ repeat: order[(idx + 1) % order.length] });
  },

  addToQueue: (song) => set({ queue: [...get().queue, song] }),

  removeFromQueue: (index) => {
    const { queue, queueIndex, current } = get();
    if (index < 0 || index >= queue.length) return;
    const nextQueue = queue.filter((_, i) => i !== index);
    if (!nextQueue.length) {
      set({
        queue: [],
        queueIndex: 0,
        current: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        shuffleOrder: [],
      });
      return;
    }

    let nextIndex = queueIndex;
    if (index < queueIndex) nextIndex -= 1;
    if (index === queueIndex) {
      nextIndex = Math.min(queueIndex, nextQueue.length - 1);
      set({
        queue: nextQueue,
        queueIndex: nextIndex,
        ...loadTrack(nextQueue[nextIndex]),
        isPlaying: get().isPlaying,
      });
      return;
    }

    set({ queue: nextQueue, queueIndex: nextIndex, current });
  },

  playFromQueue: (index) => {
    const song = get().queue[index];
    if (!song) return;
    set({
      queueIndex: index,
      ...loadTrack(song),
      shuffleOrder: get().shuffle
        ? buildShuffleOrder(get().queue.length, index)
        : get().shuffleOrder,
    });
  },

  clearQueue: () => {
    const current = get().current;
    set({
      queue: current ? [current] : [],
      queueIndex: 0,
      shuffleOrder: [],
    });
  },

  setQueueOpen: (open) => set({ isQueueOpen: open }),
  toggleQueue: () => set({ isQueueOpen: !get().isQueueOpen }),
  setExpanded: (open) => set({ isExpanded: open }),
}));
