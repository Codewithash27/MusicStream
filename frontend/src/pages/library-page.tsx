import { Plus } from "lucide-react";
import { useState, type ReactElement } from "react";

import { Button } from "../components/common/button";
import { Input } from "../components/common/input";
import { MediaTile } from "../components/common/media-tile";
import { PageHeader } from "../components/common/section-header";
import { QueryState } from "../components/common/query-state";
import { SongRow } from "../components/common/song-row";
import { getApiErrorMessage } from "../features/auth/hooks";
import { useAlbumsQuery } from "../features/albums/hooks";
import {
  useCreatePlaylistMutation,
  usePlaylistsQuery,
} from "../features/playlists/hooks";
import { useSongsQuery } from "../features/songs/hooks";
import { useAuthStore } from "../store/auth.store";
import { albumCoverStyle } from "../utils/mappers";

export function LibraryPage(): ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const myPlaylists = usePlaylistsQuery(
    { mine: true, limit: 50 },
    { enabled: isAuthenticated },
  );
  const publicPlaylists = usePlaylistsQuery(
    { limit: 20 },
    { enabled: !isAuthenticated },
  );
  const albums = useAlbumsQuery({ limit: 20 });
  const songs = useSongsQuery({ limit: 10 });
  const createPlaylist = useCreatePlaylistMutation();

  const playlists = isAuthenticated ? myPlaylists : publicPlaylists;

  return (
    <div>
      <PageHeader
        title="Your Library"
        subtitle="Playlists, albums, and liked tracks in one place."
        actions={
          isAuthenticated ? (
            <Button variant="secondary" size="sm" onClick={() => setShowCreate((v) => !v)}>
              <Plus size={16} />
              New playlist
            </Button>
          ) : undefined
        }
      />

      {showCreate ? (
        <form
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-ms-border bg-ms-surface p-4 sm:flex-row sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await createPlaylist.mutateAsync({ name: name.trim(), is_public: true });
            setName("");
            setShowCreate(false);
            void myPlaylists.refetch();
          }}
        >
          <Input
            label="Playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Late night focus"
          />
          <Button type="submit" disabled={createPlaylist.isPending || !name.trim()}>
            {createPlaylist.isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      ) : null}

      {createPlaylist.isError ? (
        <p className="mb-4 text-sm text-ms-danger">
          {getApiErrorMessage(createPlaylist.error, "Could not create playlist")}
        </p>
      ) : null}

      <h2 className="mb-3 font-display text-lg font-bold">Playlists</h2>
      <QueryState
        isLoading={playlists.isLoading}
        isError={playlists.isError}
        errorMessage={getApiErrorMessage(playlists.error)}
        onRetry={() => void playlists.refetch()}
        isEmpty={!playlists.data?.items.length}
        emptyTitle="No playlists"
        emptyDescription={
          isAuthenticated
            ? "Create your first playlist to organize songs."
            : "Log in to create and save playlists."
        }
      >
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.data?.items.map((p) => (
            <MediaTile
              key={p.id}
              to={`/playlist/${p.id}`}
              title={p.name}
              subtitle={`${p.song_count} songs · ${p.owner?.display_name ?? "You"}`}
              cover={albumCoverStyle(p.cover_url, p.id)}
            />
          ))}
        </div>
      </QueryState>

      <h2 className="mb-3 font-display text-lg font-bold">Albums</h2>
      <QueryState
        isLoading={albums.isLoading}
        isError={albums.isError}
        errorMessage={getApiErrorMessage(albums.error)}
        onRetry={() => void albums.refetch()}
        isEmpty={!albums.data?.items.length}
        emptyTitle="No albums"
        emptyDescription="Albums will show up as artists release them."
      >
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {albums.data?.items.map((a) => (
            <MediaTile
              key={a.id}
              to={`/album/${a.id}`}
              title={a.title}
              subtitle={a.artist?.stage_name ?? "Unknown"}
              cover={albumCoverStyle(a.cover_url, a.id)}
            />
          ))}
        </div>
      </QueryState>

      <h2 className="mb-3 font-display text-lg font-bold">Recent songs</h2>
      <QueryState
        isLoading={songs.isLoading}
        isError={songs.isError}
        errorMessage={getApiErrorMessage(songs.error)}
        onRetry={() => void songs.refetch()}
        isEmpty={!songs.data?.items.length}
        emptyTitle="No songs"
        emptyDescription="The catalogue is empty."
      >
        <div className="rounded-xl bg-ms-surface/40 p-2">
          {songs.data?.items.map((song, i) => (
            <SongRow key={song.id} song={song} index={i + 1} queue={songs.data?.items} />
          ))}
        </div>
      </QueryState>
    </div>
  );
}
