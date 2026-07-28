import type { ReactElement } from "react";

import { cn } from "../../utils/cn";
import { resolveMediaUrl } from "../../utils/media-url";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function Avatar({ name, imageUrl, size = "md", className }: AvatarProps): ReactElement {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const src = resolveMediaUrl(imageUrl);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("inline-block shrink-0 rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ms-primary to-emerald-900 font-semibold text-black",
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
