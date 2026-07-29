import { api } from "./client";
import type { SongListResponse } from "../types/api";

export interface LikedIdsResponse {
  song_ids: string[];
}

export const libraryApi = {
  listLiked: async (params: { skip?: number; limit?: number } = {}): Promise<SongListResponse> => {
    const { data } = await api.get<SongListResponse>("/likes", { params });
    return data;
  },

  likedIds: async (): Promise<string[]> => {
    const { data } = await api.get<LikedIdsResponse>("/likes/ids");
    return data.song_ids;
  },

  like: async (songId: string): Promise<void> => {
    await api.post(`/songs/${songId}/like`);
  },

  unlike: async (songId: string): Promise<void> => {
    await api.delete(`/songs/${songId}/like`);
  },

  reportListening: async (songId: string, seconds: number): Promise<void> => {
    await api.post("/me/listening", { song_id: songId, seconds });
  },

  recentlyPlayed: async (
    params: { skip?: number; limit?: number } = {},
  ): Promise<SongListResponse> => {
    const { data } = await api.get<SongListResponse>("/me/recently-played", { params });
    return data;
  },
};
