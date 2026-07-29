import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { Avatar } from "../components/common/avatar";
import { Button } from "../components/common/button";
import { MediaTile } from "../components/common/media-tile";
import { PageHeader } from "../components/common/section-header";
import { QueryState } from "../components/common/query-state";
import { getApiErrorMessage } from "../features/auth/hooks";
import { usePlaylistsQuery } from "../features/playlists/hooks";
import { useAuthStore } from "../store/auth.store";
import { albumCoverStyle } from "../utils/mappers";

export function ProfilePage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const playlists = usePlaylistsQuery({ mine: true, limit: 50 });

  return (
    <div>
      <div className="mb-8 flex flex-col items-start gap-5 rounded-2xl border border-ms-border bg-gradient-to-br from-ms-elevated to-ms-bg p-6 sm:flex-row sm:items-center md:p-8">
        <Avatar
          name={user?.display_name ?? "User"}
          imageUrl={user?.avatar_url}
          size="lg"
          className="h-28 w-28 text-3xl"
        />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-ms-muted">Profile</p>
          <h1 className="mt-1 font-display text-4xl font-extrabold">
            {user?.display_name ?? "Listener"}
          </h1>
          <p className="mt-2 text-ms-muted">
            @{user?.username ?? "user"} · {user?.role ?? "USER"} ·{" "}
            {playlists.data?.total ?? 0} playlists
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/settings">
              <Button variant="secondary" size="sm">
                Edit profile
              </Button>
            </Link>
            {user?.role === "ARTIST" || user?.role === "ADMIN" ? (
              <Link to="/dashboard">
                <Button size="sm">Artist tools</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <PageHeader title="Your playlists" />
      <QueryState
        isLoading={playlists.isLoading}
        isError={playlists.isError}
        errorMessage={getApiErrorMessage(playlists.error)}
        onRetry={() => void playlists.refetch()}
        isEmpty={!playlists.data?.items.length}
        emptyTitle="No playlists yet"
        emptyDescription="Create playlists from your library."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.data?.items.map((p) => (
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
      </QueryState>
    </div>
  );
}
