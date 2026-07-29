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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-white/5 bg-ms-bg/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-ms-bg/70 sm:h-16 sm:gap-4 sm:px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-ms-muted hover:bg-white/5 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        {title ? (
          <h1 className="truncate font-display text-base font-semibold sm:text-lg md:text-xl">
            {title}
          </h1>
        ) : (
          <>
            <Link
              to="/search"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-ms-elevated px-3 py-2 text-sm text-ms-muted hover:text-ms-text sm:max-w-md md:px-4"
            >
              <Search size={16} className="shrink-0" />
              <span className="truncate">Search songs, artists, albums</span>
            </Link>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="rounded-full p-2 text-ms-muted hover:bg-white/5"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <Link to="/profile" className="rounded-full p-1 hover:bg-white/5">
          <Avatar name={user?.display_name ?? "User"} imageUrl={user?.avatar_url} size="sm" />
        </Link>
      </div>
    </header>
  );
}
