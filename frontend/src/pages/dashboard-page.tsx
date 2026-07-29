import { Disc3, Heart, Play, Shield, Users } from "lucide-react";
import { useMemo, type ReactElement } from "react";
import { Link, Navigate } from "react-router-dom";

import { Button } from "../components/common/button";
import { QueryState } from "../components/common/query-state";
import { PageHeader } from "../components/common/section-header";
import { SongRow } from "../components/common/song-row";
import { getApiErrorMessage } from "../features/auth/hooks";
import { useSongsQuery } from "../features/songs/hooks";
import { useAuthStore } from "../store/auth.store";

export function DashboardPage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const songs = useSongsQuery({ limit: 100 });

  const mySongs = useMemo(() => {
    const items = songs.data?.items ?? [];
    if (!user) return [];
    return items.filter(
      (s) =>
        s.artist?.stage_name === user.display_name ||
        s.artist?.stage_name === user.username,
    );
  }, [songs.data?.items, user]);

  const totalPlays = mySongs.reduce((sum, s) => sum + s.play_count, 0);
  const topTracks = [...mySongs].sort((a, b) => b.play_count - a.play_count).slice(0, 8);

  if (user && user.role !== "ARTIST" && user.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  const stats = [
    { label: "Total plays", value: totalPlays.toLocaleString(), icon: Play },
    { label: "Followers", value: "—", icon: Users },
    { label: "Likes", value: "—", icon: Heart },
    { label: "Tracks", value: String(mySongs.length), icon: Disc3 },
  ];

  return (
    <div>
      {user?.role === "ADMIN" ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-ms-border bg-ms-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 shrink-0 text-ms-primary" size={20} />
            <div>
              <p className="font-semibold">Admin panel</p>
              <p className="text-sm text-ms-muted">
                View all users and activate or deactivate accounts.
              </p>
            </div>
          </div>
          <Link to="/admin">
            <Button size="sm">Manage users</Button>
          </Link>
        </div>
      ) : null}

      <PageHeader
        title="Artist dashboard"
        subtitle="Performance for your uploaded catalog."
        actions={
          <Link to="/upload">
            <Button>Upload song</Button>
          </Link>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-ms-border bg-ms-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-ms-muted">{label}</p>
              <Icon size={18} className="text-ms-primary" />
            </div>
            <p className="font-display text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-ms-border bg-ms-surface p-5">
        <h2 className="mb-4 font-display text-xl font-bold">Top tracks</h2>
        <QueryState
          isLoading={songs.isLoading}
          isError={songs.isError}
          errorMessage={getApiErrorMessage(songs.error)}
          onRetry={() => void songs.refetch()}
          isEmpty={!topTracks.length}
          emptyTitle="No uploads yet"
          emptyDescription="Upload your first track to see stats here."
        >
          <div className="song-scroll-list">
            {topTracks.map((song, i) => (
              <SongRow key={song.id} song={song} index={i + 1} showAlbum={false} queue={topTracks} />
            ))}
          </div>
        </QueryState>
      </section>
    </div>
  );
}
