export type MockSong = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
  plays: string;
};

export type MockAlbum = {
  id: string;
  title: string;
  artist: string;
  year: string;
  cover: string;
  tracks: number;
};

export type MockPlaylist = {
  id: string;
  title: string;
  description: string;
  cover: string;
  songs: number;
  owner: string;
};

export type MockArtist = {
  id: string;
  name: string;
  listeners: string;
  cover: string;
  verified: boolean;
};

export const MOCK_SONGS: MockSong[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Nova Pulse",
    album: "Neon Horizons",
    duration: "3:42",
    cover: "linear-gradient(135deg,#1db954,#0a3d22)",
    plays: "12.4M",
  },
  {
    id: "2",
    title: "Glass City",
    artist: "Echo Valley",
    album: "Reflections",
    duration: "4:05",
    cover: "linear-gradient(135deg,#3b82f6,#0f172a)",
    plays: "8.1M",
  },
  {
    id: "3",
    title: "Slow Burn",
    artist: "Luna Grey",
    album: "After Hours",
    duration: "3:18",
    cover: "linear-gradient(135deg,#f43f5e,#1f0a12)",
    plays: "21.7M",
  },
  {
    id: "4",
    title: "Orbit",
    artist: "Astra",
    album: "Starlight",
    duration: "2:56",
    cover: "linear-gradient(135deg,#a855f7,#1e1033)",
    plays: "5.9M",
  },
  {
    id: "5",
    title: "Golden Hour",
    artist: "Solstice",
    album: "Daybreak",
    duration: "3:33",
    cover: "linear-gradient(135deg,#f59e0b,#3b1d05)",
    plays: "17.2M",
  },
  {
    id: "6",
    title: "Static Hearts",
    artist: "Wireframe",
    album: "Signals",
    duration: "4:21",
    cover: "linear-gradient(135deg,#14b8a6,#042f2e)",
    plays: "3.4M",
  },
];

export const MOCK_ALBUMS: MockAlbum[] = [
  {
    id: "a1",
    title: "Neon Horizons",
    artist: "Nova Pulse",
    year: "2025",
    cover: "linear-gradient(145deg,#1db954,#052e16)",
    tracks: 12,
  },
  {
    id: "a2",
    title: "After Hours",
    artist: "Luna Grey",
    year: "2024",
    cover: "linear-gradient(145deg,#be123c,#1c0510)",
    tracks: 10,
  },
  {
    id: "a3",
    title: "Starlight",
    artist: "Astra",
    year: "2025",
    cover: "linear-gradient(145deg,#7c3aed,#1e0b3b)",
    tracks: 9,
  },
  {
    id: "a4",
    title: "Daybreak",
    artist: "Solstice",
    year: "2023",
    cover: "linear-gradient(145deg,#d97706,#2a1604)",
    tracks: 11,
  },
];

export const MOCK_PLAYLISTS: MockPlaylist[] = [
  {
    id: "p1",
    title: "Focus Flow",
    description: "Deep concentration tracks for late nights.",
    cover: "linear-gradient(145deg,#0ea5e9,#0c4a6e)",
    songs: 48,
    owner: "MusicStream",
  },
  {
    id: "p2",
    title: "Weekend Warmup",
    description: "Upbeat picks to start the party.",
    cover: "linear-gradient(145deg,#22c55e,#14532d)",
    songs: 36,
    owner: "MusicStream",
  },
  {
    id: "p3",
    title: "Rainy Day Soft",
    description: "Gentle vocals and ambient layers.",
    cover: "linear-gradient(145deg,#64748b,#0f172a)",
    songs: 52,
    owner: "You",
  },
  {
    id: "p4",
    title: "Gym Ignition",
    description: "High BPM fuel for your set.",
    cover: "linear-gradient(145deg,#ef4444,#450a0a)",
    songs: 40,
    owner: "You",
  },
];

export const MOCK_ARTISTS: MockArtist[] = [
  {
    id: "ar1",
    name: "Nova Pulse",
    listeners: "4.2M monthly",
    cover: "linear-gradient(145deg,#1db954,#064e3b)",
    verified: true,
  },
  {
    id: "ar2",
    name: "Luna Grey",
    listeners: "9.8M monthly",
    cover: "linear-gradient(145deg,#e11d48,#4c0519)",
    verified: true,
  },
  {
    id: "ar3",
    name: "Astra",
    listeners: "2.1M monthly",
    cover: "linear-gradient(145deg,#8b5cf6,#2e1065)",
    verified: false,
  },
  {
    id: "ar4",
    name: "Echo Valley",
    listeners: "1.5M monthly",
    cover: "linear-gradient(145deg,#3b82f6,#1e3a8a)",
    verified: true,
  },
];

export const SEARCH_CATEGORIES = [
  { title: "Pop", tone: "linear-gradient(135deg,#ec4899,#831843)" },
  { title: "Hip-Hop", tone: "linear-gradient(135deg,#f97316,#7c2d12)" },
  { title: "Electronic", tone: "linear-gradient(135deg,#06b6d4,#164e63)" },
  { title: "Indie", tone: "linear-gradient(135deg,#84cc16,#365314)" },
  { title: "R&B", tone: "linear-gradient(135deg,#a855f7,#581c87)" },
  { title: "Jazz", tone: "linear-gradient(135deg,#eab308,#713f12)" },
];
