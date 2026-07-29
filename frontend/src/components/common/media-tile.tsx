import { Play } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../utils/cn";
import { PlaylistCover } from "./playlist-cover";

interface MediaTileProps {
  to: string;
  title: string;
  subtitle: string;
  cover: string;
  playlistCoverUrls?: Array<string | null>;
  playlistCoverSeed?: string;
  rounded?: "xl" | "full";
  className?: string;
}

export function MediaTile({
  to,
  title,
  subtitle,
  cover,
  playlistCoverUrls,
  playlistCoverSeed,
  rounded = "xl",
  className,
}: MediaTileProps): ReactElement {
  return (
    <Link
      to={to}
      className={cn(
        "group block rounded-xl bg-ms-surface p-3 transition hover:bg-ms-elevated",
        className,
      )}
    >
      <div className="relative mb-3 aspect-square overflow-hidden shadow-lg shadow-black/40">
        {playlistCoverUrls && playlistCoverSeed ? (
          <PlaylistCover
            songCoverUrls={playlistCoverUrls}
            seed={playlistCoverSeed}
            className="h-full w-full rounded-lg"
          />
        ) : (
          <div
            className={cn(
              "h-full w-full",
              rounded === "full" ? "rounded-full" : "rounded-lg",
            )}
            style={{ background: cover }}
          />
        )}
        <button
          type="button"
          aria-label={`Play ${title}`}
          className="absolute bottom-2 right-2 flex h-11 w-11 translate-y-3 items-center justify-center rounded-full bg-ms-primary text-black opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <Play size={18} fill="currentColor" />
        </button>
      </div>
      <h3 className="truncate font-semibold">{title}</h3>
      <p className="mt-1 truncate text-sm text-ms-muted">{subtitle}</p>
    </Link>
  );
}
