import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { songsApi, type SongListParams, type UploadSongPayload } from "../../api/songs";

export const songKeys = {
  all: ["songs"] as const,
  list: (params: SongListParams) => ["songs", "list", params] as const,
  detail: (id: string) => ["songs", "detail", id] as const,
};

export function useSongsQuery(
  params: SongListParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: songKeys.list(params),
    queryFn: () => songsApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useSongQuery(id: string | undefined) {
  return useQuery({
    queryKey: songKeys.detail(id ?? ""),
    queryFn: () => songsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useUploadSongMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadSongPayload) => songsApi.upload(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
}

export function useUploadSongCoverMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ songId, cover }: { songId: string; cover: File }) =>
      songsApi.uploadCover(songId, cover),
    onSuccess: (song) => {
      void queryClient.invalidateQueries({ queryKey: songKeys.all });
      queryClient.setQueryData(songKeys.detail(song.id), song);
    },
  });
}
