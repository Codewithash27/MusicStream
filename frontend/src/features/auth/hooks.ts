import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi, type LoginPayload, type RegisterPayload } from "../../api/auth";
import { getApiErrorMessage } from "../../api/client";
import { useAuthStore } from "../../store/auth.store";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMeQuery(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: enabled && isAuthenticated,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.isError && isAuthenticated) {
      // Session invalid — interceptor may already clear; ensure local state
      const status = (query.error as { response?: { status?: number } })?.response?.status;
      if (status === 401) clearSession();
    }
  }, [query.isError, query.error, isAuthenticated, clearSession]);

  return query;
}

export function useLoginMutation() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setSession({
        user: data.user,
        accessToken: data.tokens.access_token,
        refreshToken: data.tokens.refresh_token,
      });
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useRegisterMutation() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      setSession({
        user: data.user,
        accessToken: data.tokens.access_token,
        refreshToken: data.tokens.refresh_token,
      });
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useLogoutMutation() {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          // Still clear local session
        }
      }
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

export { getApiErrorMessage };
