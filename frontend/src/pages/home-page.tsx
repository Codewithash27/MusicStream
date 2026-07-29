import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/common/button";
import { MediaTile } from "../components/common/media-tile";
import { QueryState } from "../components/common/query-state";
import { SectionHeader } from "../components/common/section-header";
import { SongRow } from "../components/common/song-row";
import { getApiErrorMessage } from "../features/auth/hooks";
import { useAlbumsQuery } from "../features/albums/hooks";
import {
  useLikedSongsQuery,
  useRecentlyPlayedQuery,
} from "../features/library/hooks";
import { usePlaylistsQuery } from "../features/playlists/hooks";
import { useSongsQuery } from "../features/songs/hooks";
import { albumCoverStyle } from "../utils/mappers";

export function HomePage(): ReactElement {
  const songs = useSongsQuery({ limit: 8 });
  const albums = useAlbumsQuery({ limit: 8 });
  const playlists = usePlaylistsQuery({ limit: 8 });
  const recent = useRecentlyPlayedQuery({ limit: 8 });
  const liked = useLikedSongsQuery({ limit: 8 });

  const loading = songs.isLoading || albums.isLoading || playlists.isLoading;
  const error = songs.isError || albums.isError || playlists.isError;

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1db95433] via-ms-surface to-ms-bg p-6 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ms-primary">
          Good evening
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
          Pick up where you left off
        </h1>
        <p className="mt-3 max-w-lg text-ms-muted">
          Fresh drops, liked tracks, and artists you love — ready when you are.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/library">
            <Button>Open library</Button>
          </Link>
          <Link to="/search">
            <Button variant="secondary">Browse all</Button>
          </Link>
        </div>
      </section>

      <QueryState
        isLoading={loading}
        isError={error}
        errorMessage={getApiErrorMessage(
          songs.error || albums.error || playlists.error,
          "Could not load your home feed",
        )}
        onRetry={() => {
          void songs.refetch();
          void albums.refetch();
          void playlists.refetch();
        }}
      >
        <section>
          <SectionHeader title="Recently played" actionLabel="Library" actionTo="/library" />
          <QueryState
            isLoading={recent.isLoading}
            isEmpty={!recent.isLoading && !recent.data?.items.length}
            emptyTitle="Nothing played yet"
            emptyDescription="Play a song and it will show up here."
          >
            <div className="song-scroll-list rounded-xl bg-ms-surface/50 p-2">
              {recent.data?.items.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={i + 1}
                  queue={recent.data?.items}
                />
              ))}
            </div>
          </QueryState>
        </section>

        <section>
          <SectionHeader title="Recently uploaded" actionLabel="All songs" actionTo="/search" />
          <QueryState
            isEmpty={!songs.data?.items.length}
            emptyTitle="No songs yet"
            emptyDescription="Upload tracks as an artist to populate the catalogue."
          >
            <div className="song-scroll-list rounded-xl bg-ms-surface/50 p-2">
              {songs.data?.items.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={i + 1}
                  queue={songs.data?.items}
                />
              ))}
            </div>
          </QueryState>
        </section>

        <section>
          <SectionHeader title="Liked songs" actionLabel="Library" actionTo="/library" />
          <QueryState
            isLoading={liked.isLoading}
            isEmpty={!liked.isLoading && !liked.data?.items.length}
            emptyTitle="No liked songs"
            emptyDescription="Tap the heart on any track to save it here."
          >
            <div className="song-scroll-list rounded-xl bg-ms-surface/50 p-2">
              {liked.data?.items.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={i + 1}
                  queue={liked.data?.items}
                />
              ))}
            </div>
          </QueryState>
        </section>

        <section>
          <SectionHeader title="Playlists" actionLabel="Show all" actionTo="/library" />
          <QueryState
            isEmpty={!playlists.data?.items.length}
            emptyTitle="No playlists yet"
            emptyDescription="Create a playlist from your library to see it here."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {playlists.data?.items.map((p) => (
                <MediaTile
                  key={p.id}
                  to={`/playlist/${p.id}`}
                  title={p.name}
                  subtitle={p.description || `${p.song_count} songs`}
                  cover={albumCoverStyle(p.cover_url, p.id)}
                  playlistCoverUrls={p.cover_url ? undefined : p.preview_cover_urls}
                  playlistCoverSeed={p.id}
                />
              ))}
            </div>
          </QueryState>
        </section>

        <section>
          <SectionHeader title="Albums" actionLabel="Show all" actionTo="/search" />
          <QueryState
            isEmpty={!albums.data?.items.length}
            emptyTitle="No albums yet"
            emptyDescription="Albums appear here once artists publish them."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {albums.data?.items.map((a) => (
                <MediaTile
                  key={a.id}
                  to={`/album/${a.id}`}
                  title={a.title}
                  subtitle={`${a.artist?.stage_name ?? "Unknown"} · ${a.track_count} tracks`}
                  cover={albumCoverStyle(a.cover_url, a.id)}
                />
              ))}
            </div>
          </QueryState>
        </section>
      </QueryState>
    </div>
  );
}
