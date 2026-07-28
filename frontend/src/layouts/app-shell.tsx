import { useState, type ReactElement } from "react";
import { Outlet } from "react-router-dom";

import { SessionHydrator } from "../components/auth/session-hydrator";
import { Sidebar } from "../components/layout/sidebar";
import { TopBar } from "../components/layout/top-bar";
import { usePlayerStore } from "../store/player.store";

export function AppShell(): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasTrack = usePlayerStore((s) => Boolean(s.current));

  return (
    <div className="min-h-screen bg-ms-bg text-ms-text">
      <SessionHydrator />
      <div className="flex min-h-screen">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={() => setMenuOpen(true)} />
          <main
            className={`flex-1 px-4 pt-4 md:px-6 md:pt-6 ${hasTrack ? "pb-28 md:pb-32" : "pb-8"}`}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
