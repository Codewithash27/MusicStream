import { Clock3, PauseCircle, PlayCircle, Users } from "lucide-react";
import { useMemo, useState, type ReactElement } from "react";
import { Navigate } from "react-router-dom";

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

export function AdminPage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [filter, setFilter] = useState<ActiveFilter>("all");

  const listParams = useMemo(
    () => ({
      q: q || undefined,
      is_active: filter === "all" ? undefined : filter === "active",
      limit: 50,
      skip: 0,
    }),
    [q, filter],
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
      label: "Total users",
      value: stats.data?.total_users.toLocaleString() ?? "—",
      icon: Users,
    },
    {
      label: "Active",
      value: stats.data?.active_users.toLocaleString() ?? "—",
      icon: PlayCircle,
    },
    {
      label: "Inactive",
      value: stats.data?.inactive_users.toLocaleString() ?? "—",
      icon: PauseCircle,
    },
    {
      label: "Listening time",
      value: stats.data ? formatListenTime(stats.data.total_listen_seconds) : "—",
      icon: Clock3,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin"
        subtitle="Manage accounts, activation, and listening totals."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold">Users</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex rounded-full border border-ms-border bg-ms-elevated p-1 text-xs font-semibold">
              {(["all", "active", "inactive"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 capitalize transition",
                    filter === key ? "bg-ms-primary text-black" : "text-ms-muted hover:text-ms-text",
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setQ(draftQ.trim());
              }}
            >
              <input
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Search email, username…"
                className="h-10 w-full min-w-[200px] rounded-full border border-ms-border bg-ms-elevated px-4 text-sm outline-none focus:border-ms-primary sm:w-64"
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
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
                        <div className="flex items-center gap-3">
                          <Avatar name={row.display_name} imageUrl={row.avatar_url} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{row.display_name}</p>
                            <p className="truncate text-xs text-ms-muted">
                              @{row.username} · {row.email}
                            </p>
                          </div>
                        </div>
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
                        <Button
                          size="sm"
                          variant={row.is_active ? "danger" : "secondary"}
                          disabled={isSelf || busy}
                          onClick={() =>
                            void setActive.mutateAsync({
                              userId: row.id,
                              is_active: !row.is_active,
                            })
                          }
                        >
                          {busy
                            ? "Saving…"
                            : isSelf
                              ? "You"
                              : row.is_active
                                ? "Deactivate"
                                : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
