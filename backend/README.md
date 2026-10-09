# Backend

FastAPI server for sign up, log in and Google sign-in. Users are stored in PostgreSQL.

## Run it

```bash
cp .env.example .env   # first time only, then fill in the values
uv run uvicorn app.main:app --reload --port 8000
```

Try the endpoints at http://localhost:8000/docs.

## Where things are

| File | What it does |
| --- | --- |
| `app/main.py` | Creates the app, sets up CORS, registers the routers |
| `app/config.py` | Reads settings from `.env` |
| `app/routers/auth.py` | The endpoints: `/api/auth/signup`, `/login`, `/google`, `/me` |
| `app/schemas.py` | The JSON each endpoint accepts and returns |
| `app/security.py` | Password hashing, login tokens, Google token check |
| `app/dependencies.py` | `get_current_user`, used by endpoints that need a logged-in user |
| `app/store.py` | Reads and writes the `users` table |
| `app/db.py` | The database connection pool; creates the table at startup |
