import { useQuery } from "@tanstack/react-query";

import { albumsApi, type AlbumListParams } from "../../api/albums";

export const albumKeys = {
  all: ["albums"] as const,
  list: (params: AlbumListParams) => ["albums", "list", params] as const,
  detail: (id: string) => ["albums", "detail", id] as const,
};

export function useAlbumsQuery(
  params: AlbumListParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: albumKeys.list(params),
    queryFn: () => albumsApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useAlbumQuery(id: string | undefined) {
  return useQuery({
    queryKey: albumKeys.detail(id ?? ""),
    queryFn: () => albumsApi.get(id!),
    enabled: Boolean(id),
  });
}
