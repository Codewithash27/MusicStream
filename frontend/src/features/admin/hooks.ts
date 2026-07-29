import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi, type AdminUserListParams } from "../../api/admin";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: (params: AdminUserListParams) => [...adminKeys.all, "users", params] as const,
};

export function useAdminStatsQuery(enabled = true) {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => adminApi.stats(),
    enabled,
  });
}

export function useAdminUsersQuery(params: AdminUserListParams, enabled = true) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.listUsers(params),
    enabled,
  });
}

export function useSetUserActiveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, is_active }: { userId: string; is_active: boolean }) =>
      adminApi.setUserActive(userId, is_active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
