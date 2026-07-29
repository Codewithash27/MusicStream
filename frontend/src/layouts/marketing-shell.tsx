import type { ReactElement } from "react";
import { Link, Outlet } from "react-router-dom";

import { Button } from "../components/common/button";
import { usePlayerStore } from "../store/player.store";

export function MarketingShell(): ReactElement {
  const hasTrack = usePlayerStore((s) => Boolean(s.current));

  return (
    <div
      className={`min-h-dvh bg-ms-bg text-ms-text ${
        hasTrack ? "pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-28" : ""
      }`}
    >
      <header className="absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 md:px-6 xl:px-8">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
            Music<span className="text-ms-primary">Stream</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
