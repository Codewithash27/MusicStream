import type { ReactElement } from "react";

import { albumCoverStyle, coverFromSeed } from "../../utils/mappers";
import { resolveMediaUrl } from "../../utils/media-url";
import { cn } from "../../utils/cn";

interface PlaylistCoverProps {
  coverUrl?: string | null;
  songCoverUrls?: Array<string | null>;
  seed: string;
  className?: string;
}

export function PlaylistCover({
  coverUrl,
  songCoverUrls = [],
  seed,
  className,
}: PlaylistCoverProps): ReactElement {
  if (coverUrl) {
    return (
      <div
        className={cn("overflow-hidden bg-cover bg-center", className)}
        style={{ background: albumCoverStyle(coverUrl, seed) }}
      />
    );
  }

  const tiles = songCoverUrls.slice(0, 4);
  if (tiles.length === 0) {
    return (
      <div
        className={cn("overflow-hidden bg-cover bg-center", className)}
        style={{ background: coverFromSeed(seed) }}
      />
    );
  }

  if (tiles.length === 1) {
    const resolved = resolveMediaUrl(tiles[0]);
    return (
      <div
        className={cn("overflow-hidden bg-cover bg-center", className)}
        style={{
          background: resolved
            ? `center / cover url("${resolved}")`
            : coverFromSeed(`${seed}-0`),
        }}
      />
    );
  }

  const fourTiles = [...tiles];
  while (fourTiles.length < 4) fourTiles.push(null);

  return (
    <div
      className={cn(
        "grid grid-cols-2 grid-rows-2 overflow-hidden bg-ms-elevated",
        className,
      )}
      aria-label="Playlist cover collage"
    >
      {fourTiles.map((url, index) => {
        const resolved = resolveMediaUrl(url);
        return (
          <div
            key={`${url ?? "fallback"}-${index}`}
            className="bg-cover bg-center"
            style={{
              background: resolved
                ? `center / cover url("${resolved}")`
                : coverFromSeed(`${seed}-${index}`),
            }}
          />
        );
      })}
    </div>
  );
}
