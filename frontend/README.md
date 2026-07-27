# MusicStream Frontend

Dark Spotify-inspired UI for MusicStream. Pages use mock data — API wiring comes next.

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173

## Pages

| Route | Page |
|-------|------|
| `/` | Landing |
| `/login` | Login |
| `/register` | Register |
| `/home` | Home |
| `/search` | Search |
| `/library` | Library |
| `/playlist/:id` | Playlist |
| `/album/:id` | Album |
| `/artist/:id` | Artist |
| `/upload` | Upload Song |
| `/dashboard` | Artist Dashboard |
| `/settings` | Settings |
| `/profile` | Profile |
| `*` | 404 |

## Design

- Primary `#1DB954` · Background `#121212` · Surface `#181818`
- Fonts: Syne (display) + DM Sans (body)
- Reusable: Button, Input, SongRow, MediaTile, Sidebar, PlayerBar, etc.
