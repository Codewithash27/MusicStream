# MusicStream Frontend

React 19 + Vite + TypeScript + Tailwind + TanStack Query + Zustand.

## Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set the API base URL in `.env`:

```env
VITE_APP_NAME=MusicStream
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_PORT=5173
```

## Features (live API)

- Auth: register, login, logout, session hydrate via `/auth/me`
- JWT access + refresh in Zustand persist (`localStorage` key `musicstream-auth`)
- Axios client attaches `Authorization: Bearer` and refreshes on 401
- Songs: list, detail (`/song/:id`), upload (`POST /songs/upload`), cover (`POST /songs/{id}/cover`)
- Albums & playlists: list, detail, create playlist, add song to playlist
- Artist pages from `artist_id` song/album filters
- Avatar upload/delete on Settings (`POST/DELETE /users/avatar`)
- Loading / error / empty states via `QueryState` — no mock catalogue JSON

App: http://localhost:5173
