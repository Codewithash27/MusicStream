import { Heart } from "lucide-react";
import type { ReactElement } from "react";

import { useLikedIdsQuery, useToggleLikeMutation } from "../../features/library/hooks";
import { cn } from "../../utils/cn";

interface LikeButtonProps {
  songId: string;
  size?: number;
  className?: string;
}

export function LikeButton({ songId, size = 16, className }: LikeButtonProps): ReactElement {
  const likedIds = useLikedIdsQuery();
  const toggle = useToggleLikeMutation();
  const liked = (likedIds.data ?? []).includes(songId);

  const onClick = () => {
    if (toggle.isPending) return;
    void toggle.mutateAsync({ songId, liked });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={toggle.isPending || likedIds.isLoading}
      className={cn(
        "transition hover:scale-105 disabled:opacity-50",
        liked ? "text-ms-primary" : "text-ms-muted hover:text-ms-primary",
        className,
      )}
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      title={liked ? "Unlike" : "Like"}
    >
      <Heart size={size} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}
