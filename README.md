# MusicStream

Spotify-style music streaming app — **FastAPI** backend + **React (Vite)** frontend.

You upload songs as the artist. You share one link with a few friends (about **3–4 people**). They only **listen** — they do not upload.

**Step-by-step free deploy (recommended):** [DEPLOY_WALKTHROUGH.md](./DEPLOY_WALKTHROUGH.md)  
Formal project write-up: [REPORT.md](./REPORT.md)

---

## Yes — free sharing works for a small friend group

This is **not** built here for 50 / 100 / 1000 users. For **3–4 friends listening**, free tiers are enough.

| Part | Free service | Why you need it |
|------|----------------|-----------------|
| Website UI | **Vercel** | The link you send friends |
| API | **Render** | Login + song list (sleeps when idle → first open can be slow) |
| Database + files | **Supabase** | Accounts, song metadata, MP3s, covers, avatars |

**Recommended free combo:** **Vercel + Render + Supabase** (database and storage in one Supabase project).

### What your friends do

1. Open your **Vercel** link.  
2. Register as **Listener** (not Artist).  
3. Open Home / Search / Library and play.

They **only listen**. Only **you** (Artist) upload tracks.

---

## Important limitation

Vercel alone cannot run the FastAPI API or store MP3 files. Use **Vercel (UI) + Render (API) + Supabase (DB + Storage)**.

All uploads (songs, covers, avatars) go to **Supabase Storage** public buckets so friends can stream audio from anywhere.

---

## Local development

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env → DATABASE_URL, JWT_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
alembic upgrade head
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

App: http://localhost:5173

---

## Free production deploy (share with 3–4 friends)

### 1) Supabase (database)

1. Create a free project (or keep the one you already have).  
2. Copy the Postgres connection string.  
3. If the password contains `@`, URL-encode it as `%40`.  
4. Use the **async** form:

```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.XXXX.supabase.co:5432/postgres
```

Run migrations once:

```bash
cd backend
alembic upgrade head
```

### 2) Supabase Storage (audio + covers + avatars)

Needed so MP3s stay online for friends.

1. In the same Supabase project → **Storage**.  
2. Create three **public** buckets: `songs`, `covers`, `avatars`.  
3. **Project Settings → API** → copy:
   - **Project URL** → `SUPABASE_URL` (e.g. `https://your-project.supabase.co`)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret; backend only)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET_SONGS=songs
SUPABASE_STORAGE_BUCKET_COVERS=covers
SUPABASE_STORAGE_BUCKET_AVATARS=avatars
```

### 3) Backend on Render (free)

1. [Render](https://dashboard.render.com) → **New → Web Service**.  
2. Connect `https://github.com/Codewithash27/MusicStream.git`.  
3. Settings:

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

4. Environment variables:

```env
APP_NAME=MusicStream
APP_ENV=production
APP_DEBUG=false
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET_KEY=<long-random-secret>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=https://YOUR-FRONTEND.vercel.app
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=*
CORS_ALLOW_HEADERS=*
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET_SONGS=songs
SUPABASE_STORAGE_BUCKET_COVERS=covers
SUPABASE_STORAGE_BUCKET_AVATARS=avatars
MAX_AUDIO_UPLOAD_BYTES=26214400
MAX_COVER_UPLOAD_BYTES=5242880
MAX_AVATAR_UPLOAD_BYTES=5242880
```

5. Deploy. Health check: `https://YOUR-API.onrender.com/api/v1/health`

> Free Render **sleeps when idle**. The first open after a while can take 30–60s — fine for a few friends.

### 4) Frontend on Vercel (free)

1. [Vercel](https://vercel.com) → import the same GitHub repo.  
2. Configure:

| Setting | Value |
|---------|--------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Env:

```env
VITE_APP_NAME=MusicStream
VITE_API_URL=https://YOUR-API.onrender.com/api/v1
```

4. Deploy → you get something like `https://musicstream.vercel.app`.  
5. Put that exact URL in Render `CORS_ORIGINS` and redeploy the API.

### 5) You upload · friends only listen

**You (once):**

1. Open the Vercel URL.  
2. Register / log in as **Artist**.  
3. Upload your MP3s on **Upload** (after Supabase Storage buckets are configured).

**Friends (3–4 people):**

1. You send them the **Vercel link**.  
2. They register as **Listener**.  
3. They play songs on Home / Search / Library.  
4. They never need Upload.

**Share:** `https://YOUR-APP.vercel.app`

---

## Checklist before sending the link

- [ ] DB migrated (`alembic upgrade head`)  
- [ ] Supabase Storage buckets (`songs`, `covers`, `avatars`) created and public  
- [ ] Render health is OK  
- [ ] A song uploaded **after** storage is configured  
- [ ] Vercel `VITE_API_URL` → Render `/api/v1`  
- [ ] Render `CORS_ORIGINS` = exact Vercel URL  
- [ ] You tested play in an Incognito window as a Listener  

---

## Roles (simple)

| Who | Role | What they do |
|-----|------|----------------|
| You | Artist | Upload + listen |
| Friends | Listener | Listen only |

---

## Project layout

```
MusicStream/
├── backend/
├── frontend/
├── REPORT.md
├── .gitignore
└── README.md
```

Never commit real `.env` files — only `.env.example`.

---

## Push docs to GitHub

```powershell
cd d:\Music
git add README.md REPORT.md
git commit -m "Add free deploy README and project report"
git push origin main
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Friends see songs but no sound | Check Supabase buckets are public; re-upload songs |
| CORS / network errors | Fix `CORS_ORIGINS`, redeploy API |
| Wrong API on Vercel | Rebuild after setting `VITE_API_URL` |
| First load very slow | Render cold start — wait and refresh |
| Login fails in prod | Check `DATABASE_URL` and `JWT_SECRET_KEY` on Render |
| Upload fails | Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Render |

---

## License

Personal / educational project — share the Vercel link with a few friends for listening.
