import { api } from "./client";
import type { ListParams, Song, SongListResponse } from "../types/api";

export interface SongListParams extends ListParams {
  artist_id?: string;
  album_id?: string;
}

export interface UploadSongPayload {
  title: string;
  duration_seconds: number;
  track_number?: number;
  album_id?: string;
  audio: File;
  cover?: File | null;
}

export const songsApi = {
  list: async (params: SongListParams = {}): Promise<SongListResponse> => {
    const { data } = await api.get<SongListResponse>("/songs", { params });
    return data;
  },

  get: async (id: string): Promise<Song> => {
    const { data } = await api.get<Song>(`/songs/${id}`);
    return data;
  },

  play: async (id: string): Promise<Song> => {
    const { data } = await api.post<Song>(`/songs/${id}/play`);
    return data;
  },

  /** POST /songs/upload — MP3 + optional cover */
  upload: async (payload: UploadSongPayload): Promise<Song> => {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("duration_seconds", String(payload.duration_seconds));
    if (payload.track_number != null) {
      form.append("track_number", String(payload.track_number));
    }
    if (payload.album_id) {
      form.append("album_id", payload.album_id);
    }
    form.append("audio", payload.audio);
    if (payload.cover) {
      form.append("cover", payload.cover);
    }
    const { data } = await api.post<Song>("/songs/upload", form, { timeout: 120_000 });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/songs/${id}`);
  },

  /** POST /songs/{id}/cover */
  uploadCover: async (songId: string, cover: File): Promise<Song> => {
    const form = new FormData();
    form.append("cover", cover);
    const { data } = await api.post<Song>(`/songs/${songId}/cover`, form, {
      timeout: 60_000,
    });
    return data;
  },
};
