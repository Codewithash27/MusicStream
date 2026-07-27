import { Bell, Menu, Search } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";
import { Avatar } from "../common/avatar";

interface TopBarProps {
  title?: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps): ReactElement {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-ms-bg/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-ms-muted hover:bg-white/5 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        {title ? (
          <h1 className="font-display text-lg font-semibold md:text-xl">{title}</h1>
        ) : (
          <Link
            to="/search"
            className="hidden items-center gap-2 rounded-full bg-ms-elevated px-4 py-2 text-sm text-ms-muted hover:text-ms-text md:flex"
          >
            <Search size={16} />
            Search songs, artists, albums
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-full p-2 text-ms-muted hover:bg-white/5"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <Link to="/profile" className="rounded-full p-1 hover:bg-white/5">
          <Avatar name={user?.display_name ?? "User"} size="sm" />
        </Link>
      </div>
    </header>
  );
}
