import { ArrowLeft, Clock3 } from "lucide-react";
import type { ReactElement } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { formatListenTime } from "../api/admin";
import { getApiErrorMessage } from "../api/client";
import { Avatar } from "../components/common/avatar";
import { Button } from "../components/common/button";
import { QueryState } from "../components/common/query-state";
import { PageHeader } from "../components/common/section-header";
import { SongRow } from "../components/common/song-row";
import { useAdminUserQuery, useSetUserActiveMutation } from "../features/admin/hooks";
import { useAuthStore } from "../store/auth.store";
import { cn } from "../utils/cn";

export function AdminUserPage(): ReactElement {
  const { id } = useParams();
  const me = useAuthStore((s) => s.user);
  const isAdmin = me?.role === "ADMIN";
  const detail = useAdminUserQuery(id, isAdmin);
  const setActive = useSetUserActiveMutation();

  if (me && me.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  const user = detail.data?.user;
  const mostPlayed = detail.data?.most_played ?? [];
  const isSelf = user?.id === me?.id;
  const busy = setActive.isPending;

  return (
    <div>
      <Link
        to="/admin"
        className="mb-4 inline-flex items-center gap-2 text-sm text-ms-muted hover:text-ms-text"
      >
        <ArrowLeft size={16} />
        Back to users
      </Link>

      <QueryState
        isLoading={detail.isLoading}
        isError={detail.isError}
        errorMessage={getApiErrorMessage(detail.error, "User not found")}
        onRetry={() => void detail.refetch()}
      >
        {user ? (
          <>
            <PageHeader
              title={user.display_name}
              subtitle={`@${user.username} · ${user.email}`}
              actions={
                <Button
                  size="sm"
                  variant={user.is_active ? "danger" : "secondary"}
                  disabled={isSelf || busy}
                  onClick={() =>
                    void setActive.mutateAsync({
                      userId: user.id,
                      is_active: !user.is_active,
                    })
                  }
                >
                  {busy
                    ? "Saving…"
                    : isSelf
                      ? "You"
                      : user.is_active
                        ? "Deactivate"
                        : "Activate"}
                </Button>
              }
            />

            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-ms-border bg-ms-surface p-5 sm:flex-row sm:items-center">
              <Avatar name={user.display_name} imageUrl={user.avatar_url} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ms-elevated px-2.5 py-1 text-xs font-semibold text-ms-muted">
                    {user.role}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      user.is_active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400",
                    )}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-ms-muted">
                  <Clock3 size={14} className="text-ms-primary" />
                  Listening time: {formatListenTime(user.total_listen_seconds)}
                </p>
                <p className="mt-1 text-xs text-ms-muted">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-ms-border bg-ms-surface p-5">
              <h2 className="mb-4 font-display text-xl font-bold">Most played songs</h2>
              <QueryState
                isEmpty={!mostPlayed.length}
                emptyTitle="No plays yet"
                emptyDescription="This user hasn’t played any songs yet."
              >
                <div className="song-scroll-list">
                  {mostPlayed.map(({ song, play_count, listened_seconds }, i) => (
                    <div key={song.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <SongRow
                          song={song}
                          index={i + 1}
                          queue={mostPlayed.map((m) => m.song)}
                        />
                      </div>
                      <span className="shrink-0 pr-2 text-right text-xs text-ms-muted">
                        <span className="block font-semibold text-ms-text">
                          {formatListenTime(listened_seconds)}
                        </span>
                        {play_count} play{play_count === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))}
                </div>
              </QueryState>
            </section>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
