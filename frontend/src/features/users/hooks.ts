import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usersApi } from "../../api/users";
import { authKeys } from "../auth/hooks";
import { useAuthStore } from "../../store/auth.store";

export function useUploadAvatarMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useDeleteAvatarMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersApi.deleteAvatar(),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}
