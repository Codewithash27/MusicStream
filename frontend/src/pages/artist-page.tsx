import { BadgeCheck, Play } from "lucide-react";
import type { ReactElement } from "react";
import { useParams } from "react-router-dom";

import { Button } from "../components/common/button";
import { MediaTile } from "../components/common/media-tile";
import { SectionHeader } from "../components/common/section-header";
import { SongRow } from "../components/common/song-row";
import { MOCK_ALBUMS, MOCK_ARTISTS, MOCK_SONGS } from "../utils/mock-data";
import { usePlayerStore } from "../store/player.store";

export function ArtistPage(): ReactElement {
  const { id } = useParams();
  const artist = MOCK_ARTISTS.find((a) => a.id === id) ?? MOCK_ARTISTS[0];
  const playSong = usePlayerStore((s) => s.playSong);

  return (
    <div>
      <div
        className="relative mb-8 overflow-hidden rounded-2xl px-6 pb-8 pt-24 md:px-10 md:pt-32"
        style={{
          background: `linear-gradient(180deg, transparent 0%, #121212 95%), ${artist.cover}`,
          minHeight: 280,
        }}
      >
        {artist.verified ? (
          <p className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">
            <BadgeCheck size={16} className="text-sky-400" />
            Verified Artist
          </p>
        ) : null}
        <h1 className="font-display text-5xl font-extrabold md:text-7xl">{artist.name}</h1>
        <p className="mt-3 text-ms-muted">{artist.listeners} listeners</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => playSong(MOCK_SONGS[0], { queue: MOCK_SONGS })}>
            <Play size={16} fill="currentColor" />
            Play
          </Button>
          <Button variant="secondary">Follow</Button>
        </div>
      </div>

      <SectionHeader title="Popular" />
      <div className="mb-10 rounded-xl bg-ms-surface/30 p-2">
        {MOCK_SONGS.slice(0, 5).map((song, i) => (
          <SongRow
            key={song.id}
            song={{ ...song, artist: artist.name }}
            index={i + 1}
          />
        ))}
      </div>

      <SectionHeader title="Discography" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {MOCK_ALBUMS.map((a) => (
          <MediaTile
            key={a.id}
            to={`/album/${a.id}`}
            title={a.title}
            subtitle={`${a.year} · Album`}
            cover={a.cover}
          />
        ))}
      </div>
    </div>
  );
}
