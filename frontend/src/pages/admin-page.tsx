import {
  Clock3,
  LoaderCircle,
  PauseCircle,
  PlayCircle,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { useMemo, useState, type ReactElement } from "react";
import { Link, Navigate } from "react-router-dom";

import { formatListenTime } from "../api/admin";
import { getApiErrorMessage } from "../api/client";
import { Avatar } from "../components/common/avatar";
import { Button } from "../components/common/button";
import { QueryState } from "../components/common/query-state";
import { PageHeader } from "../components/common/section-header";
import {
  useAdminStatsQuery,
  useAdminUsersQuery,
  useSetUserActiveMutation,
} from "../features/admin/hooks";
import { useAuthStore } from "../store/auth.store";
import { cn } from "../utils/cn";

type ActiveFilter = "all" | "active" | "inactive";
type SortMode = "newest" | "listen";

export function AdminPage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [filter, setFilter] = useState<ActiveFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [listenersOnly, setListenersOnly] = useState(false);

  const listParams = useMemo(
    () => ({
      q: q || undefined,
      is_active: filter === "all" ? undefined : filter === "active",
      has_listened: listenersOnly ? true : undefined,
      sort_by: sortMode === "listen" ? ("listen_time" as const) : ("created_at" as const),
      sort_dir: "desc" as const,
      limit: 50,
      skip: 0,
    }),
    [q, filter, sortMode, listenersOnly],
  );

  const isAdmin = user?.role === "ADMIN";
  const stats = useAdminStatsQuery(isAdmin);
  const users = useAdminUsersQuery(listParams, isAdmin);
  const setActive = useSetUserActiveMutation();

  if (user && user.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  const cards = [
    {
      key: "total",
      label: "Total users",
      value: stats.data?.total_users.toLocaleString() ?? "—",
      icon: Users,
      active: !listenersOnly && filter === "all" && sortMode === "newest",
      hint: undefined,
      onClick: () => {
        setFilter("all");
        setListenersOnly(false);
        setSortMode("newest");
      },
    },
    {
      key: "active",
      label: "Active",
      value: stats.data?.active_users.toLocaleString() ?? "—",
      icon: PlayCircle,
      active: filter === "active" && !listenersOnly,
      onClick: () => {
        setFilter("active");
        setListenersOnly(false);
      },
    },
    {
      key: "inactive",
      label: "Inactive",
      value: stats.data?.inactive_users.toLocaleString() ?? "—",
      icon: PauseCircle,
      active: filter === "inactive" && !listenersOnly,
      onClick: () => {
        setFilter("inactive");
        setListenersOnly(false);
      },
    },
    {
      key: "listen",
      label: "Listening time",
      value: stats.data ? formatListenTime(stats.data.total_listen_seconds) : "—",
      icon: Clock3,
      active: sortMode === "listen",
      onClick: () => {
        setSortMode("listen");
        setListenersOnly(false);
        setFilter("all");
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin"
        subtitle="Manage accounts, activation, and listening totals. Click a user to open their profile."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, value, icon: Icon, active, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className={cn(
              "rounded-2xl border bg-ms-surface p-5 text-left transition hover:border-ms-primary/60",
              active ? "border-ms-primary ring-1 ring-ms-primary/40" : "border-ms-border",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-ms-muted">{label}</p>
              <Icon size={18} className="text-ms-primary" />
            </div>
            <p className="font-display text-3xl font-bold">{value}</p>
            {key === "listen" ? (
              <p className="mt-2 text-xs text-ms-muted">
                Click to sort everyone by playtime
              </p>
            ) : null}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-ms-border bg-ms-surface p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold">Users</h2>
          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="flex overflow-x-auto rounded-full border border-ms-border bg-ms-elevated p-1 text-xs font-semibold">
              {(["all", "active", "inactive"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFilter(key);
                    setListenersOnly(false);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 capitalize transition",
                    filter === key && !listenersOnly
                      ? "bg-ms-primary text-black"
                      : "text-ms-muted hover:text-ms-text",
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
            <div className="flex overflow-x-auto rounded-full border border-ms-border bg-ms-elevated p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSortMode("newest");
                  setListenersOnly(false);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 transition",
                  sortMode === "newest" && !listenersOnly
                    ? "bg-ms-primary text-black"
                    : "text-ms-muted hover:text-ms-text",
                )}
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => setSortMode("listen")}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 transition",
                  sortMode === "listen"
                    ? "bg-ms-primary text-black"
                    : "text-ms-muted hover:text-ms-text",
                )}
              >
                Playtime
              </button>
              <button
                type="button"
                onClick={() => setListenersOnly((v) => !v)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 transition",
                  listenersOnly
                    ? "bg-ms-primary text-black"
                    : "text-ms-muted hover:text-ms-text",
                )}
                title="Only users with listening time"
              >
                Listeners
              </button>
            </div>
            <form
              className="flex w-full gap-2 lg:ml-auto lg:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                setQ(draftQ.trim());
              }}
            >
              <input
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Search email, username…"
                className="h-10 min-w-0 flex-1 rounded-full border border-ms-border bg-ms-elevated px-4 text-sm outline-none focus:border-ms-primary lg:w-64 lg:flex-none"
              />
              <Button type="submit" size="sm" variant="secondary">
                Search
              </Button>
            </form>
          </div>
        </div>

        <QueryState
          isLoading={users.isLoading}
          isError={users.isError}
          errorMessage={getApiErrorMessage(users.error)}
          onRetry={() => void users.refetch()}
          isEmpty={!users.data?.items.length}
          emptyTitle="No users found"
          emptyDescription="Try a different search or filter."
        >
          <div>
            {/* Phone / small tablet cards */}
            <div className="space-y-3 md:hidden">
              {users.data?.items.map((row) => {
                const isSelf = row.id === user?.id;
                const busy =
                  setActive.isPending && setActive.variables?.userId === row.id;
                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-ms-border bg-ms-elevated/40 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Link to={`/admin/users/${row.id}`} className="shrink-0">
                        <Avatar name={row.display_name} imageUrl={row.avatar_url} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/admin/users/${row.id}`}
                          className="block truncate font-semibold hover:underline"
                        >
                          {row.display_name}
                        </Link>
                        <p className="truncate text-xs text-ms-muted">
                          @{row.username}
                        </p>
                        <p className="truncate text-xs text-ms-muted">{row.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-ms-muted">{row.role}</span>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 font-semibold",
                              row.is_active
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-red-500/15 text-red-400",
                            )}
                          >
                            {row.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className="text-ms-muted">
                            {formatListenTime(row.total_listen_seconds)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Link
                          to={`/admin/users/${row.id}`}
                          title={`View ${row.display_name}'s profile`}
                          aria-label={`View ${row.display_name}'s profile`}
                          className="inline-flex size-9 items-center justify-center rounded-full border border-ms-border bg-ms-elevated text-ms-muted transition hover:border-ms-primary hover:text-ms-primary"
                        >
                          <UserRound size={17} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          title={
                            isSelf
                              ? "You cannot change your own status"
                              : row.is_active
                                ? `Deactivate ${row.display_name}`
                                : `Activate ${row.display_name}`
                          }
                          aria-label={
                            isSelf
                              ? "Your account"
                              : row.is_active
                                ? `Deactivate ${row.display_name}`
                                : `Activate ${row.display_name}`
                          }
                          disabled={isSelf || busy}
                          onClick={() =>
                            void setActive.mutateAsync({
                              userId: row.id,
                              is_active: !row.is_active,
                            })
                          }
                          className={cn(
                            "inline-flex size-9 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40",
                            row.is_active
                              ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                          )}
                        >
                          {busy ? (
                            <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                          ) : row.is_active ? (
                            <UserX size={17} aria-hidden="true" />
                          ) : (
                            <UserCheck size={17} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tablet / desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm lg:min-w-0">
                <thead className="border-b border-ms-border text-ms-muted">
                  <tr>
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Listening</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data?.items.map((row) => {
                    const isSelf = row.id === user?.id;
                    const busy =
                      setActive.isPending && setActive.variables?.userId === row.id;
                    return (
                      <tr key={row.id} className="border-b border-ms-border/60">
                        <td className="py-3 pr-4">
                          <Link
                            to={`/admin/users/${row.id}`}
                            className="flex items-center gap-3 rounded-lg transition hover:bg-white/5"
                          >
                            <Avatar name={row.display_name} imageUrl={row.avatar_url} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold hover:underline">
                                {row.display_name}
                              </p>
                              <p className="truncate text-xs text-ms-muted">
                                @{row.username} · {row.email}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-ms-muted">{row.role}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              row.is_active
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-red-500/15 text-red-400",
                            )}
                          >
                            {row.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-ms-muted">
                          {formatListenTime(row.total_listen_seconds)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/users/${row.id}`}
                              title={`View ${row.display_name}'s profile`}
                              aria-label={`View ${row.display_name}'s profile`}
                              className="inline-flex size-9 items-center justify-center rounded-full border border-ms-border bg-ms-elevated text-ms-muted transition hover:border-ms-primary hover:text-ms-primary"
                            >
                              <UserRound size={17} aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              title={
                                isSelf
                                  ? "You cannot change your own status"
                                  : row.is_active
                                    ? `Deactivate ${row.display_name}`
                                    : `Activate ${row.display_name}`
                              }
                              aria-label={
                                isSelf
                                  ? "Your account"
                                  : row.is_active
                                    ? `Deactivate ${row.display_name}`
                                    : `Activate ${row.display_name}`
                              }
                              disabled={isSelf || busy}
                              onClick={() =>
                                void setActive.mutateAsync({
                                  userId: row.id,
                                  is_active: !row.is_active,
                                })
                              }
                              className={cn(
                                "inline-flex size-9 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40",
                                row.is_active
                                  ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                              )}
                            >
                              {busy ? (
                                <LoaderCircle
                                  size={17}
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                              ) : row.is_active ? (
                                <UserX size={17} aria-hidden="true" />
                              ) : (
                                <UserCheck size={17} aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {users.data ? (
              <p className="mt-4 text-xs text-ms-muted">
                Showing {users.data.items.length} of {users.data.total} users
              </p>
            ) : null}
            {setActive.isError ? (
              <p className="mt-2 text-sm text-red-400">
                {getApiErrorMessage(setActive.error)}
              </p>
            ) : null}
          </div>
        </QueryState>
      </section>
    </div>
  );
}
