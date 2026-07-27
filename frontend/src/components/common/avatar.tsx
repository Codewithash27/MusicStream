import type { ReactElement } from "react";

import { cn } from "../../utils/cn";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function Avatar({ name, size = "md", className }: AvatarProps): ReactElement {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-ms-primary to-emerald-900 font-semibold text-black",
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
