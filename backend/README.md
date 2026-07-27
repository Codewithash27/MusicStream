# MusicStream Backend

Production-ready FastAPI backend for the **MusicStream** music streaming platform.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Python 3.12+ |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 (async) |
| Driver | asyncpg |
| Migrations | Alembic |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + bcrypt (Passlib) |
| Validation | Pydantic v2 |
| Server | Uvicorn |

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # Versioned HTTP routes
│   ├── core/            # Config, security, lifespan, logging
│   ├── db/              # Async engine & session
│   ├── models/          # SQLAlchemy ORM models (pending)
│   ├── schemas/         # Pydantic request/response schemas (pending)
│   ├── services/        # Business logic layer (pending)
│   ├── repositories/    # Data access layer (pending)
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Shared helpers
│   ├── dependencies/    # FastAPI Depends() helpers
│   └── main.py          # Application factory & entrypoint
├── migrations/          # Alembic migration scripts
├── tests/
├── .env.example
├── alembic.ini
├── requirements.txt
└── README.md
```

## Getting Started

### 1. Create a virtual environment

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `DATABASE_URL` — your Supabase PostgreSQL async connection string  
  (`postgresql+asyncpg://user:password@host:5432/postgres`)
- `JWT_SECRET_KEY` — a long, random secret

### 4. Run the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: http://localhost:8000/docs  
- Health: http://localhost:8000/api/v1/health  

### 5. Run migrations (when models exist)

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

### 6. Run tests

```bash
pytest
```

## Architecture Notes

- **Layered design** — routes → services → repositories → models keeps concerns separated.
- **Async throughout** — SQLAlchemy async engine + asyncpg for non-blocking I/O.
- **Settings via BaseSettings** — typed, validated config from env / `.env`.
- **Lifespan hooks** — DB connectivity check on startup; engine dispose on shutdown.
- **CORS** — configurable origins for frontend clients.
- **JWT auth** — bcrypt passwords, access + refresh tokens with DB-backed rotation/revoke.
- **OpenAPI disabled in production** — docs/redoc hidden when `APP_ENV=production`.

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Create account (`USER` or `ARTIST`) |
| POST | `/api/v1/auth/login` | Public | Login with email or username |
| POST | `/api/v1/auth/refresh` | Public | Rotate access + refresh tokens |
| POST | `/api/v1/auth/logout` | Public | Revoke refresh token |
| GET | `/api/v1/auth/me` | Bearer | Current user profile |

Use **Authorize** in `/docs` with the `access_token` value (HTTP Bearer).

Roles: `USER`, `ARTIST`, `ADMIN` (ADMIN cannot self-register). Protect routes with `CurrentUser`, `ArtistUser`, or `AdminUser` dependencies.

## Next Steps

Domain APIs for songs, albums, playlists, and likes.