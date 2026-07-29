import { Search } from "lucide-react";
import { useDeferredValue, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { MediaTile } from "../components/common/media-tile";
import { PageHeader } from "../components/common/section-header";
import { QueryState } from "../components/common/query-state";
import { SongRow } from "../components/common/song-row";
import { getApiErrorMessage } from "../features/auth/hooks";
import { useAlbumsQuery } from "../features/albums/hooks";
import { usePlaylistsQuery } from "../features/playlists/hooks";
import { useSongsQuery } from "../features/songs/hooks";
import { useAuthStore } from "../store/auth.store";
import { albumCoverStyle } from "../utils/mappers";
import { SEARCH_CATEGORIES } from "../utils/search-categories";

export function SearchPage(): ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q.trim());
  const isSearching = deferredQ.length > 0;

  const allSongs = useSongsQuery({ limit: 100 }, { enabled: !isSearching });
  const songs = useSongsQuery(
    { q: deferredQ || undefined, limit: 100 },
    { enabled: isSearching },
  );
  const albums = useAlbumsQuery(
    { q: deferredQ || undefined, limit: 24 },
    { enabled: isSearching },
  );
  const playlists = usePlaylistsQuery(
    { mine: true, q: deferredQ || undefined, limit: 24 },
    { enabled: isSearching && isAuthenticated },
  );

  const songList = isSearching ? songs : allSongs;

  return (
    <div>
      <PageHeader title="Search" subtitle="Browse the full catalogue or search by name." />

      <div className="relative mb-8">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ms-muted"
          size={18}
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What do you want to listen to?"
          className="h-12 w-full rounded-full border border-ms-border bg-ms-elevated pl-11 pr-4 outline-none focus:border-ms-primary"
        />
      </div>

      {!isSearching ? (
        <>
          <h2 className="mb-4 font-display text-xl font-bold">Browse all</h2>
          <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {SEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat.title}
                type="button"
                onClick={() => setQ(cat.title)}
                className="relative h-28 overflow-hidden rounded-xl p-4 text-left font-display text-lg font-bold"
                style={{ background: cat.tone }}
              >
                {cat.title}
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-bold">All songs</h2>
            {allSongs.data ? (
              <p className="text-sm text-ms-muted">{allSongs.data.total} tracks</p>
            ) : null}
          </div>
          <QueryState
            isLoading={allSongs.isLoading}
            isError={allSongs.isError}
            errorMessage={getApiErrorMessage(allSongs.error, "Could not load songs")}
            onRetry={() => void allSongs.refetch()}
            isEmpty={!allSongs.data?.items.length}
            emptyTitle="No songs yet"
            emptyDescription="Upload tracks as an artist to populate the catalogue."
          >
            <div className="song-scroll-list rounded-xl bg-ms-surface/40 p-2">
              {allSongs.data?.items.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={i + 1}
                  queue={allSongs.data?.items}
                />
              ))}
            </div>
          </QueryState>
        </>
      ) : (
        <QueryState
          isLoading={songs.isLoading || albums.isLoading || playlists.isLoading}
          isError={songs.isError || albums.isError || playlists.isError}
          errorMessage={getApiErrorMessage(
            songs.error || albums.error || playlists.error,
            "Search failed",
          )}
          onRetry={() => {
            void songs.refetch();
            void albums.refetch();
            void playlists.refetch();
          }}
          isEmpty={
            !songs.data?.items.length &&
            !albums.data?.items.length &&
            !playlists.data?.items.length
          }
          emptyTitle={`No results for “${deferredQ}”`}
          emptyDescription="Try another spelling or a broader keyword."
        >
          {songList.data?.items.length ? (
            <section className="mb-10">
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="font-display text-xl font-bold">Songs</h2>
                <p className="text-sm text-ms-muted">{songList.data.total} matches</p>
              </div>
              <div className="song-scroll-list rounded-xl bg-ms-surface/40 p-2">
                {songList.data.items.map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={i + 1}
                    queue={songList.data.items}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {albums.data?.items.length ? (
            <section className="mb-10">
              <h2 className="mb-3 font-display text-xl font-bold">Albums</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {albums.data.items.map((a) => (
                  <MediaTile
                    key={a.id}
                    to={`/album/${a.id}`}
                    title={a.title}
                    subtitle={a.artist?.stage_name ?? "Unknown"}
                    cover={albumCoverStyle(a.cover_url, a.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {playlists.data?.items.length ? (
            <section>
              <h2 className="mb-3 font-display text-xl font-bold">Your playlists</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {playlists.data.items.map((p) => (
                  <MediaTile
                    key={p.id}
                    to={`/playlist/${p.id}`}
                    title={p.name}
                    subtitle={`${p.song_count} songs`}
                    cover={albumCoverStyle(p.cover_url, p.id)}
                    playlistCoverUrls={p.cover_url ? undefined : p.preview_cover_urls}
                    playlistCoverSeed={p.id}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {!songs.data?.items.length && albums.data?.items.length ? (
            <Link to="/library" className="mt-6 inline-block text-sm text-ms-muted hover:text-ms-text">
              Browse your library
            </Link>
          ) : null}
        </QueryState>
      )}
    </div>
  );
}
