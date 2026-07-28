/**
 * Central API surface for MusicStream frontend.
 * All modules share the Axios client in `./client` (JWT + refresh).
 */
export { api, API_BASE_URL, getApiErrorMessage } from "./client";
export { authApi, type LoginPayload, type RegisterPayload } from "./auth";
export {
  songsApi,
  type SongListParams,
  type UploadSongPayload,
} from "./songs";
export { albumsApi, type AlbumListParams } from "./albums";
export {
  playlistsApi,
  type CreatePlaylistPayload,
  type PlaylistListParams,
} from "./playlists";
export { usersApi } from "./users";
