import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  playlistsApi,
  type CreatePlaylistPayload,
  type PlaylistListParams,
} from "../../api/playlists";

export const playlistKeys = {
  all: ["playlists"] as const,
  list: (params: PlaylistListParams) => ["playlists", "list", params] as const,
  detail: (id: string) => ["playlists", "detail", id] as const,
};

export function usePlaylistsQuery(
  params: PlaylistListParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: playlistKeys.list(params),
    queryFn: () => playlistsApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function usePlaylistQuery(id: string | undefined) {
  return useQuery({
    queryKey: playlistKeys.detail(id ?? ""),
    queryFn: () => playlistsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePlaylistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlaylistPayload) => playlistsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all });
    },
  });
}

export function useAddSongToPlaylistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      playlistsApi.addSong(playlistId, songId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      void queryClient.invalidateQueries({ queryKey: playlistKeys.detail(vars.playlistId) });
    },
  });
}

export function useRemoveSongFromPlaylistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      playlistsApi.removeSong(playlistId, songId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      void queryClient.invalidateQueries({ queryKey: playlistKeys.detail(vars.playlistId) });
    },
  });
}

export function useReorderPlaylistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songIds }: { playlistId: string; songIds: string[] }) =>
      playlistsApi.reorder(playlistId, songIds),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.detail(vars.playlistId) });
    },
  });
}
