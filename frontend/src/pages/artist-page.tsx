import { BadgeCheck, Play } from "lucide-react";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "../components/common/button";
import { MediaTile } from "../components/common/media-tile";
import { QueryState } from "../components/common/query-state";
import { SectionHeader } from "../components/common/section-header";
import { SongRow } from "../components/common/song-row";
import { getApiErrorMessage } from "../features/auth/hooks";
import { useAlbumsQuery } from "../features/albums/hooks";
import { useSongsQuery } from "../features/songs/hooks";
import { usePlayerStore } from "../store/player.store";
import { albumCoverStyle, coverFromSeed, songToTrack } from "../utils/mappers";

export function ArtistPage(): ReactElement {
  const { id } = useParams();
  const playSong = usePlayerStore((s) => s.playSong);

  const songs = useSongsQuery({ artist_id: id, limit: 50 }, { enabled: Boolean(id) });
  const albums = useAlbumsQuery({ artist_id: id, limit: 50 }, { enabled: Boolean(id) });

  const artist = songs.data?.items[0]?.artist ?? albums.data?.items[0]?.artist;
  const tracks = songs.data?.items ?? [];
  const loading = songs.isLoading || albums.isLoading;
  const error = songs.isError || albums.isError;
  const cover = artist?.image_url
    ? albumCoverStyle(artist.image_url, artist.id)
    : coverFromSeed(id ?? "artist");

  return (
    <div>
      <div
        className="relative mb-8 overflow-hidden rounded-2xl px-6 pb-8 pt-24 md:px-10 md:pt-32"
        style={{
          background: `linear-gradient(180deg, transparent 0%, #121212 95%), ${cover}`,
          minHeight: 280,
        }}
      >
        {artist?.is_verified ? (
          <p className="mb-2 inline-flex items-center gap-1 text-sm font-semibold">
            <BadgeCheck size={16} className="text-sky-400" />
            Verified Artist
          </p>
        ) : null}
        <h1 className="font-display text-5xl font-extrabold md:text-7xl">
          {artist?.stage_name ?? "Artist"}
        </h1>
        <p className="mt-3 text-ms-muted">
          {tracks.reduce((sum, s) => sum + s.play_count, 0).toLocaleString()} plays ·{" "}
          {tracks.length} tracks
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            disabled={!tracks.length}
            onClick={() => {
              if (!tracks.length) return;
              playSong(songToTrack(tracks[0]), { queue: tracks.map(songToTrack) });
            }}
          >
            <Play size={16} fill="currentColor" />
            Play
          </Button>
          <Link to="/search">
            <Button variant="secondary">Browse</Button>
          </Link>
        </div>
      </div>

      <QueryState
        isLoading={loading}
        isError={error}
        errorMessage={getApiErrorMessage(songs.error || albums.error)}
        onRetry={() => {
          void songs.refetch();
          void albums.refetch();
        }}
        isEmpty={!loading && !tracks.length && !albums.data?.items.length}
        emptyTitle="No music yet"
        emptyDescription="This artist has not published any songs or albums."
      >
        {tracks.length ? (
          <>
            <SectionHeader title="Popular" />
            <div className="song-scroll-list mb-10 rounded-xl bg-ms-surface/30 p-2">
              {tracks.slice(0, 10).map((song, i) => (
                <SongRow key={song.id} song={song} index={i + 1} queue={tracks} />
              ))}
            </div>
          </>
        ) : null}

        {albums.data?.items.length ? (
          <>
            <SectionHeader title="Discography" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {albums.data.items.map((a) => (
                <MediaTile
                  key={a.id}
                  to={`/album/${a.id}`}
                  title={a.title}
                  subtitle={`${a.release_date?.slice(0, 4) ?? "Album"} · ${a.track_count} songs`}
                  cover={albumCoverStyle(a.cover_url, a.id)}
                />
              ))}
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
