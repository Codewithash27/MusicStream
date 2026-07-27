import { Disc3, Heart, Play, Users } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/common/button";
import { PageHeader } from "../components/common/section-header";
import { SongRow } from "../components/common/song-row";
import { MOCK_SONGS } from "../utils/mock-data";

const stats = [
  { label: "Total plays", value: "128.4K", icon: Play },
  { label: "Followers", value: "12.9K", icon: Users },
  { label: "Likes", value: "8.2K", icon: Heart },
  { label: "Tracks", value: "24", icon: Disc3 },
];

export function DashboardPage(): ReactElement {
  return (
    <div>
      <PageHeader
        title="Artist dashboard"
        subtitle="Track performance for your catalog."
        actions={
          <Link to="/upload">
            <Button>Upload song</Button>
          </Link>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-ms-border bg-ms-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-ms-muted">{label}</p>
              <Icon size={18} className="text-ms-primary" />
            </div>
            <p className="font-display text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-ms-border bg-ms-surface p-5">
          <h2 className="mb-4 font-display text-xl font-bold">Top tracks</h2>
          <div>
            {MOCK_SONGS.slice(0, 5).map((song, i) => (
              <SongRow key={song.id} song={song} index={i + 1} showAlbum={false} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ms-border bg-ms-surface p-5">
          <h2 className="mb-4 font-display text-xl font-bold">Audience</h2>
          <div className="space-y-4">
            {[
              { city: "Mumbai", pct: 28 },
              { city: "Delhi", pct: 21 },
              { city: "Bengaluru", pct: 17 },
              { city: "London", pct: 12 },
            ].map((row) => (
              <div key={row.city}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.city}</span>
                  <span className="text-ms-muted">{row.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ms-elevated">
                  <div
                    className="h-full rounded-full bg-ms-primary"
                    style={{ width: `${row.pct * 3}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
