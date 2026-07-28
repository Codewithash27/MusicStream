import { api } from "./client";
import type { User } from "../types/api";

export const usersApi = {
  uploadAvatar: async (file: File): Promise<User> => {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.post<User>("/users/avatar", form, { timeout: 60_000 });
    return data;
  },

  deleteAvatar: async (): Promise<User> => {
    const { data } = await api.delete<User>("/users/avatar");
    return data;
  },
};
