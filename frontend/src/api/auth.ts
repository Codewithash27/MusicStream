import { api } from "./client";
import type { AuthResponse, User, UserRole } from "../types/api";

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  display_name: string;
  role?: Exclude<UserRole, "ADMIN">;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  refresh: async (refresh_token: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/refresh", { refresh_token });
    return data;
  },

  logout: async (refresh_token: string): Promise<void> => {
    await api.post("/auth/logout", { refresh_token });
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};
