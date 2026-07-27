import type { ReactElement } from "react";
import { Link, Outlet } from "react-router-dom";

import { Button } from "../components/common/button";
import { usePlayerStore } from "../store/player.store";

export function MarketingShell(): ReactElement {
  const hasTrack = usePlayerStore((s) => Boolean(s.current));

  return (
    <div className={`min-h-screen bg-ms-bg text-ms-text ${hasTrack ? "pb-24 md:pb-28" : ""}`}>
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
            Music<span className="text-ms-primary">Stream</span>
          </Link>
          <div className="flex items-center gap-2">
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
