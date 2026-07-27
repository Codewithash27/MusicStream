import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "../store/auth.store";
import type { ApiErrorBody, AuthResponse } from "../types/api";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, clearSession, user } = useAuthStore.getState();
  if (!refreshToken) {
    clearSession();
    return null;
  }

  try {
    const { data } = await axios.post<AuthResponse>(
      `${baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    setSession({
      user: data.user ?? user!,
      accessToken: data.tokens.access_token,
      refreshToken: data.tokens.refresh_token,
    });
    return data.tokens.access_token;
  } catch {
    clearSession();
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let browser set multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      const url = original.url ?? "";
      if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return (
      error.response?.data?.error?.message ||
      error.message ||
      fallback
    );
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
