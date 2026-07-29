import { api } from "./client";
import type {
  ListParams,
  PlaylistDetail,
  PlaylistListResponse,
} from "../types/api";

export interface PlaylistListParams extends ListParams {
  mine?: boolean;
}

export interface CreatePlaylistPayload {
  name: string;
  description?: string;
  cover_url?: string;
  is_public?: boolean;
}

export const playlistsApi = {
  list: async (params: PlaylistListParams = {}): Promise<PlaylistListResponse> => {
    const { data } = await api.get<PlaylistListResponse>("/playlists", { params });
    return data;
  },

  get: async (id: string): Promise<PlaylistDetail> => {
    const { data } = await api.get<PlaylistDetail>(`/playlists/${id}`);
    return data;
  },

  create: async (payload: CreatePlaylistPayload): Promise<PlaylistDetail> => {
    const { data } = await api.post<PlaylistDetail>("/playlists", payload);
    return data;
  },

  addSong: async (playlistId: string, songId: string): Promise<PlaylistDetail> => {
    const { data } = await api.post<PlaylistDetail>(`/playlists/${playlistId}/songs`, {
      song_id: songId,
    });
    return data;
  },

  removeSong: async (playlistId: string, songId: string): Promise<PlaylistDetail> => {
    const { data } = await api.delete<PlaylistDetail>(
      `/playlists/${playlistId}/songs/${songId}`,
    );
    return data;
  },

  reorder: async (playlistId: string, songIds: string[]): Promise<PlaylistDetail> => {
    const { data } = await api.put<PlaylistDetail>(
      `/playlists/${playlistId}/reorder`,
      { song_ids: songIds },
    );
    return data;
  },
};
