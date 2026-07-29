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
    <div className="min-h-dvh bg-ms-bg text-ms-text">
      <SessionHydrator />
      <div className="flex min-h-dvh">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={() => setMenuOpen(true)} />
          <main
            className={`mx-auto w-full flex-1 px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-6 xl:px-8 ${
              hasTrack
                ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-32"
                : "pb-[calc(2rem+env(safe-area-inset-bottom))]"
            }`}
          >
            <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1600px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
