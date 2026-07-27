export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export type UserRole = "USER" | "ARTIST" | "ADMIN";

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ArtistBrief {
  id: string;
  stage_name: string;
  image_url: string | null;
  is_verified: boolean;
}

export interface Song {
  id: string;
  artist_id: string;
  album_id: string | null;
  title: string;
  duration_seconds: number;
  audio_url: string;
  cover_url: string | null;
  track_number: number | null;
  play_count: number;
  created_at: string;
  updated_at: string;
  artist: ArtistBrief | null;
}

export interface SongListResponse {
  items: Song[];
  total: number;
  skip: number;
  limit: number;
}

export interface Album {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
  artist: ArtistBrief | null;
  track_count: number;
}

export interface AlbumDetail extends Album {
  songs: Song[];
}

export interface AlbumListResponse {
  items: Album[];
  total: number;
  skip: number;
  limit: number;
}

export interface PlaylistOwner {
  id: string;
  username: string;
  display_name: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  song_count: number;
  owner: PlaylistOwner | null;
}

export interface PlaylistDetail extends Playlist {
  songs: Song[];
}

export interface PlaylistListResponse {
  items: Playlist[];
  total: number;
  skip: number;
  limit: number;
}

export interface ListParams {
  skip?: number;
  limit?: number;
  q?: string;
}
