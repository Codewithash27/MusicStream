import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi, type LoginPayload, type RegisterPayload } from "../../api/auth";
import { getApiErrorMessage } from "../../api/client";
import { useAuthStore } from "../../store/auth.store";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMeQuery(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: enabled && isAuthenticated,
    staleTime: 60_000,
  });
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
