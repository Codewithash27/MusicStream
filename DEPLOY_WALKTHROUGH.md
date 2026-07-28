# MusicStream — Free Deploy Walkthrough

**Goal:** Put MusicStream online for free → send one link to 3–4 friends → they sign up as Listener and play any song they want.

**You** = Artist (upload songs)  
**Friends** = Listener only (no upload)

---

## What you will create (all free)

| Step | Service | What you get |
|------|---------|----------------|
| A | GitHub | Code already there |
| B | Supabase | Database |
| C | Supabase Storage | MP3 + cover + avatar files |
| D | Render | Backend API |
| E | Vercel | Website link for friends |
| F | You | Upload songs, then share the link |

Estimated time: about **1–2 hours** the first time.

---

# PART 1 — Before you start

1. Have accounts ready (free):
   - [GitHub](https://github.com) — repo: `https://github.com/Codewithash27/MusicStream`
   - [Supabase](https://supabase.com)
   - [Render](https://render.com)
   - [Vercel](https://vercel.com)
2. Keep a notes file open. You will paste URLs and keys there.
3. Push latest code (README, etc.) if you have local changes:

```powershell
cd d:\Music
git add .
git status
git commit -m "Prepare for free deploy"
git push origin main
```

(Skip commit if nothing to commit.)

---

# PART 2 — Supabase (database)

### Step 1 — Create / open project
1. Go to https://supabase.com → Dashboard.  
2. Open your existing project **or** create a new free project.  
3. Wait until the project is ready.

### Step 2 — Copy database URL
1. Go to **Project Settings → Database**.  
2. Find **Connection string** (URI).  
3. Copy it. It looks like:

```text
postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

4. Change it for MusicStream:
   - Replace `postgresql://` with `postgresql+asyncpg://`
   - If password has `@`, write it as `%40`

Example:

```env
DATABASE_URL=postgresql+asyncpg://postgres:MyPass%40123@db.xxxxx.supabase.co:5432/postgres
```

Save this as **NOTE 1: DATABASE_URL**.

### Step 3 — Run migrations from your PC
Open PowerShell:

```powershell
cd d:\Music\backend
.\.venv\Scripts\activate
```

Make sure `backend\.env` has the same `DATABASE_URL` (and a `JWT_SECRET_KEY`).

Then:

```powershell
alembic upgrade head
```

If it finishes with no error, the database tables are ready.

---

# PART 3 — Supabase Storage (so friends can hear music)

Without this, friends may see song titles but **hear nothing**.

Use the **same Supabase project** from Part 2.

### Step 1 — Create public buckets
1. Supabase dashboard → **Storage**.  
2. **New bucket** → name: `songs` → enable **Public bucket** → create.  
3. Repeat for `covers` and `avatars` (both public).

You should have three public buckets: `songs`, `covers`, `avatars`.

### Step 2 — Copy API credentials
1. Go to **Project Settings → API**.  
2. Copy **Project URL**, e.g.:

```text
https://your-project.supabase.co
```

Save as **NOTE 2: SUPABASE_URL**.

3. Under **Project API keys**, copy the **service_role** key (secret — backend only, never expose in the frontend).

Save as **NOTE 3: SUPABASE_SERVICE_ROLE_KEY**.

---

# PART 4 — Render (backend API)

### Step 1 — New web service
1. https://dashboard.render.com → **New +** → **Web Service**.  
2. Connect GitHub → select **Codewithash27/MusicStream**.  
3. Fill:

| Field | Value |
|-------|--------|
| Name | `musicstream-api` (any name) |
| Region | closest to you |
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance | **Free** |

### Step 2 — Environment variables
In Render → **Environment**, add these (paste your notes):

```env
APP_NAME=MusicStream
APP_ENV=production
APP_DEBUG=false
API_V1_PREFIX=/api/v1

DATABASE_URL=<NOTE 1>

JWT_SECRET_KEY=<type a long random string, e.g. 40+ characters>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=https://placeholder.vercel.app

CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=*
CORS_ALLOW_HEADERS=*

SUPABASE_URL=<NOTE 2>
SUPABASE_SERVICE_ROLE_KEY=<NOTE 3>
SUPABASE_STORAGE_BUCKET_SONGS=songs
SUPABASE_STORAGE_BUCKET_COVERS=covers
SUPABASE_STORAGE_BUCKET_AVATARS=avatars

MAX_AUDIO_UPLOAD_BYTES=26214400
MAX_COVER_UPLOAD_BYTES=5242880
MAX_AVATAR_UPLOAD_BYTES=5242880
```

> You will fix `CORS_ORIGINS` after Vercel gives you the real URL.

### Step 3 — Deploy
1. Click **Create Web Service** / **Deploy**.  
2. Wait until status is **Live**.  
3. Copy the service URL, e.g.:

```text
https://musicstream-api.onrender.com
```

Save as **NOTE 4: API_BASE** (without `/api/v1` yet).

### Step 4 — Test API
Open in browser:

```text
https://YOUR-API.onrender.com/api/v1/health
```

You should see `"status": "healthy"` (or similar).

Optional — check storage:

```text
https://YOUR-API.onrender.com/api/v1/storage/health
```

If the first open is slow, wait up to 1 minute — free Render was sleeping.

---

# PART 5 — Vercel (website for friends)

### Step 1 — Import project
1. https://vercel.com → **Add New… → Project**.  
2. Import **Codewithash27/MusicStream**.  
3. Configure:

| Field | Value |
|-------|--------|
| Framework Preset | Vite |
| Root Directory | `frontend` (click Edit → set to `frontend`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Step 2 — Frontend env vars
Before deploy, add:

| Name | Value |
|------|--------|
| `VITE_APP_NAME` | `MusicStream` |
| `VITE_API_URL` | `https://YOUR-API.onrender.com/api/v1` |

Use your **NOTE 4** + `/api/v1`.

### Step 3 — Deploy
1. Click **Deploy**.  
2. Wait for success.  
3. Copy the site URL, e.g.:

```text
https://musicstream-xxx.vercel.app
```

Save as **NOTE 5: FRIEND_LINK** ← this is what you send friends.

### Step 4 — Fix CORS on Render
1. Go back to Render → your API → **Environment**.  
2. Change:

```env
CORS_ORIGINS=https://musicstream-xxx.vercel.app
```

Use your exact **NOTE 5** (no slash at the end).  
3. Save → Render redeploys automatically.

---

# PART 6 — You upload songs

1. Open **NOTE 5** (Vercel link) in your browser.  
2. **Register** as **Artist** (or log in if you already have that account).  
3. Go to **Upload**.  
4. Choose MP3 + cover, title, duration → **Publish**.  
5. Repeat for each song you want friends to hear.  
6. Confirm the song appears on **Home**.  
7. Click play and make sure **you can hear it**.

If you cannot hear it, stop and check Supabase Storage buckets are public and Render has the correct `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` before sharing.

---

# PART 7 — Test like a friend (important)

1. Open an **Incognito / Private** window.  
2. Open the same Vercel link.  
3. Register a new account as **Listener**.  
4. Go to Home / Search.  
5. Play a song — confirm sound works.  
6. If this works, friends will work too.

---

# PART 8 — Send link to friends

Message you can copy:

```text
Hey! Try my MusicStream app:

LINK: https://YOUR-VERCEL-URL.vercel.app

1) Click Register
2) Choose Listener (not Artist)
3) Create account
4) Open Home or Search and play any song

First load might take ~30–60 seconds if the server was sleeping — just wait and refresh once.
```

Replace the link with **NOTE 5**.

Friends can listen to **any song you uploaded**. They pick what they want on Home/Search. They do **not** upload.

---

## Quick notes sheet (fill this in)

```text
DATABASE_URL = 
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY = 
API URL (Render) = https://________.onrender.com
FRIEND LINK (Vercel) = https://________.vercel.app
JWT_SECRET_KEY = (make one up, keep private)
```

---

## If something breaks

| What you see | What to do |
|--------------|------------|
| Health page fails | Wait for Render wake-up; check env vars and logs |
| Frontend loads but login fails | Check `VITE_API_URL` and rebuild Vercel |
| CORS error in browser console | `CORS_ORIGINS` must match Vercel URL exactly |
| Songs list, no sound | Supabase buckets not public / wrong credentials / uploaded before storage was ready |
| Upload fails | Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Render |
| Friend can’t register | API sleeping — wait and retry |

---

## Order checklist (print / tick)

- [ ] Supabase `DATABASE_URL` ready  
- [ ] `alembic upgrade head` OK  
- [ ] Supabase Storage buckets (`songs`, `covers`, `avatars`) public  
- [ ] Render API live + health OK  
- [ ] Vercel site live + `VITE_API_URL` set  
- [ ] Render `CORS_ORIGINS` = Vercel URL  
- [ ] You uploaded songs as Artist (after storage is configured)  
- [ ] Incognito Listener test plays audio  
- [ ] Send Vercel link to 3–4 friends  

---

**Done:** Friends open your Vercel link → sign up as Listener → choose any song → listen.
