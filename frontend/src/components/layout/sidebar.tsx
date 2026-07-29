import {
  Home,
  Library,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Shield,
  Upload,
  UserRound,
} from "lucide-react";
import type { ReactElement } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useLogoutMutation } from "../../features/auth/hooks";
import { useAuthStore } from "../../store/auth.store";
import { cn } from "../../utils/cn";
import { Avatar } from "../common/avatar";

const links = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/upload", label: "Upload", icon: Upload, roles: ["ARTIST", "ADMIN"] as const },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ARTIST", "ADMIN"] as const },
  { to: "/admin", label: "Users", icon: Shield, roles: ["ADMIN"] as const },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: UserRound },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps): ReactElement {
  const user = useAuthStore((s) => s.user);
  const logout = useLogoutMutation();
  const navigate = useNavigate();

  const visibleLinks = links.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role as "ARTIST" | "ADMIN")),
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-black p-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 px-2 pt-2">
          <p className="font-display text-2xl font-extrabold tracking-tight">
            Music<span className="text-ms-primary">Stream</span>
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ms-muted transition hover:text-ms-text",
                  isActive && "bg-ms-elevated text-ms-text",
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl bg-ms-surface p-3">
          <div className="mb-3 flex items-center gap-3">
            <Avatar name={user?.display_name ?? "User"} imageUrl={user?.avatar_url} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.display_name ?? "Guest"}</p>
              <p className="truncate text-xs text-ms-muted">{user?.role ?? "USER"}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={logout.isPending}
            onClick={async () => {
              await logout.mutateAsync();
              onClose();
              navigate("/login", { replace: true });
            }}
            className="flex items-center gap-2 text-sm text-ms-muted hover:text-ms-text"
          >
            <LogOut size={16} />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
