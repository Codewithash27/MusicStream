import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { libraryApi } from "../../api/library";
import { useAuthStore } from "../../store/auth.store";

export const libraryKeys = {
  all: ["library"] as const,
  liked: (params: { skip?: number; limit?: number }) =>
    ["library", "liked", params] as const,
  likedIds: ["library", "liked-ids"] as const,
  recentlyPlayed: (params: { skip?: number; limit?: number }) =>
    ["library", "recently-played", params] as const,
};

export function useLikedSongsQuery(
  params: { skip?: number; limit?: number } = { limit: 50 },
  options?: { enabled?: boolean },
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: libraryKeys.liked(params),
    queryFn: () => libraryApi.listLiked(params),
    enabled: (options?.enabled ?? true) && isAuthenticated,
  });
}

export function useLikedIdsQuery(options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: libraryKeys.likedIds,
    queryFn: () => libraryApi.likedIds(),
    enabled: (options?.enabled ?? true) && isAuthenticated,
    staleTime: 30_000,
  });
}

export function useRecentlyPlayedQuery(
  params: { skip?: number; limit?: number } = { limit: 12 },
  options?: { enabled?: boolean },
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: libraryKeys.recentlyPlayed(params),
    queryFn: () => libraryApi.recentlyPlayed(params),
    enabled: (options?.enabled ?? true) && isAuthenticated,
  });
}

export function useToggleLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ songId, liked }: { songId: string; liked: boolean }) => {
      if (liked) await libraryApi.unlike(songId);
      else await libraryApi.like(songId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}
