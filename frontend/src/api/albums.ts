import { api } from "./client";
import type { AlbumDetail, AlbumListResponse, ListParams } from "../types/api";

export interface AlbumListParams extends ListParams {
  artist_id?: string;
}

export const albumsApi = {
  list: async (params: AlbumListParams = {}): Promise<AlbumListResponse> => {
    const { data } = await api.get<AlbumListResponse>("/albums", { params });
    return data;
  },

  get: async (id: string): Promise<AlbumDetail> => {
    const { data } = await api.get<AlbumDetail>(`/albums/${id}`);
    return data;
  },
};
