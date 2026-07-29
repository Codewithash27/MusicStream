import { api } from "./client";
import type { User } from "../types/api";

export interface AdminUser extends User {
  total_listen_seconds: number;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_listen_seconds: number;
  total_song_plays: number;
}

export interface AdminUserListParams {
  q?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

export const adminApi = {
  stats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>("/admin/stats");
    return data;
  },

  listUsers: async (params: AdminUserListParams = {}): Promise<AdminUserListResponse> => {
    const { data } = await api.get<AdminUserListResponse>("/admin/users", { params });
    return data;
  },

  setUserActive: async (userId: string, is_active: boolean): Promise<AdminUser> => {
    const { data } = await api.patch<AdminUser>(`/admin/users/${userId}`, { is_active });
    return data;
  },
};

export function formatListenTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${s}s`;
}
