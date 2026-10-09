# HRNexus AI

HRNexus AI is an AI career agent that helps people with overseas work experience find realistic careers and jobs in the UK.

This repository currently contains the foundation of the app: user accounts. A person can sign up with an email and password, log in, or use "Sign in with Google", and their account is stored in a PostgreSQL database.

## How it is built

| Folder | What it is | Built with |
| --- | --- | --- |
| `frontend/` | The website: sign-up, log-in and dashboard pages | React, Vite, JavaScript |
| `backend/` | The API that creates accounts and checks logins | Python, FastAPI |
| `jobflow-scribe/` | An earlier prototype of the full app, kept for reference | React, TypeScript |

The frontend runs in the browser and talks to the backend. The backend is the only part that talks to the database.

```
Browser (frontend, port 8080)  →  Backend API (port 8000)  →  PostgreSQL
```

## What you need installed

Install these before you start. The command after each one checks that it worked.

| Tool | Version | Check it with |
| --- | --- | --- |
| [Git](https://git-scm.com/downloads) | any recent | `git --version` |
| [Node.js](https://nodejs.org) | 22 or newer | `node --version` |
| [uv](https://docs.astral.sh/uv/getting-started/installation/) (runs Python) | any recent | `uv --version` |
| [PostgreSQL](https://www.postgresql.org/download/) | 15 or newer | `psql --version` |

You do not need to install Python yourself. `uv` downloads the right version (3.12) the first time you run the backend.

The PostgreSQL installer asks you to choose a password for the `postgres` user. Remember it; you need it in step 2 and step 4.

## Set up and run

Follow the steps in order. Steps 1 to 5 are done once. After that, you only repeat steps 6 and 7 to start the app.

### Step 1: Get the code

```bash
git clone https://github.com/mandigiri-karthik/HRNexus-AI.git
cd HRNexus-AI
```

### Step 2: Create the database

The backend needs an empty database called `hrnexus`. It creates its own tables the first time it starts.

**Using pgAdmin** (installed with PostgreSQL):

1. Open pgAdmin and click your server in the left panel. Enter your `postgres` password.
2. Right-click **Databases**, then choose **Create → Database…**
3. Type `hrnexus` as the name and click **Save**.

**Or using the terminal:**

```bash
createdb -U postgres hrnexus
```

### Step 3: Get a Google client ID

This is what makes the "Sign in with Google" button work. It is free.

1. Open the [Google Cloud Console credentials page](https://console.cloud.google.com/apis/credentials) and create a project if you do not have one.
2. Click **Create credentials → OAuth client ID**. If asked, set up the consent screen first with your app name and email.
3. Choose **Web application** as the application type.
4. Under **Authorized JavaScript origins**, add `http://localhost:8080`.
5. Click **Create** and copy the **Client ID**. It ends in `.apps.googleusercontent.com`.

You only need the client ID. The client secret is not used by this app.

### Step 4: Configure the backend

Create the backend's settings file from the example:

```bash
cd backend
cp .env.example .env
```

Generate a secret key for signing login tokens:

```bash
uv run python -c "import secrets; print(secrets.token_hex(32))"
```

Open `backend/.env` in an editor and fill in the four values:

```
JWT_SECRET=<the long string the command above printed>
GOOGLE_CLIENT_ID=<your client ID from step 3>
FRONTEND_ORIGINS=http://localhost:8080
DATABASE_URL=postgresql://postgres:<your postgres password>@localhost:5432/hrnexus
```

Check that the backend can reach the database:

```bash
uv run python -c "import psycopg; from app.config import DATABASE_URL; psycopg.connect(DATABASE_URL).close(); print('database ok')"
```

You should see `database ok`.

### Step 5: Configure the frontend

Open a second terminal, so the first one stays in `backend/`.

```bash
cd HRNexus-AI/frontend
cp .env.example .env
npm install
```

Open `frontend/.env` in an editor and fill in the two values:

```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<the same client ID from step 3>
```

### Step 6: Start the backend

In the first terminal, inside `backend/`:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

Wait for the line `Application startup complete.` Leave this terminal running.

To confirm it works, open http://localhost:8000/api/health in a browser. It should show `{"status":"ok"}`.

### Step 7: Start the frontend

In the second terminal, inside `frontend/`:

```bash
npm run dev
```

Leave this terminal running too.

### Step 8: Use the app

Open http://localhost:8080 in a browser.

1. Click **Create an account** and sign up with a name, an email and a password of at least 8 characters.
2. You should land on a page that says "Welcome" with your name.
3. Click **Log out**, then log in again with the same email and password.
4. Log out and try the **Sign in with Google** button.

To see the accounts you created, open pgAdmin and go to **hrnexus → Schemas → public → Tables**, then right-click **users** and choose **View/Edit Data → All Rows**.

To stop the app, press `Ctrl+C` in each terminal.

## If something goes wrong

| What you see | Likely cause | Fix |
| --- | --- | --- |
| `KeyError: 'JWT_SECRET'` (or another setting name) when the backend starts | A value is missing from `backend/.env` | Fill in all four values from step 4 |
| `password authentication failed` | The password in `DATABASE_URL` is wrong | Correct it in `backend/.env`. If the password contains `@`, `:`, `/`, `#` or `?`, it must be URL-encoded |
| `database "hrnexus" does not exist` | Step 2 was skipped | Create the database |
| `Port 8080 is already in use` | Another program is using the port | Stop that program. The port cannot be changed without also changing it in Google Cloud Console |
| "Could not reach the server" on the website | The backend is not running | Start it (step 6) |
| Google shows "origin not allowed" or a 400 error | `http://localhost:8080` is not registered | Add it under Authorized JavaScript origins (step 3) and wait a few minutes |
| "Google sign-in failed" in red after choosing an account | The two client IDs do not match | Use the same ID in `backend/.env` and `frontend/.env`, then restart both |
| Changes to a `.env` file have no effect | Settings are only read at startup | Stop and restart that terminal's command |

## Useful commands

| Where | Command | What it does |
| --- | --- | --- |
| `frontend/` | `npm run dev` | Starts the website for development |
| `frontend/` | `npm run build` | Makes a production build in `dist/` |
| `frontend/` | `npm run lint` | Checks the code for mistakes |
| `backend/` | `uv run uvicorn app.main:app --reload --port 8000` | Starts the API |
| `backend/` | `uv add <package>` | Installs a new Python package |

The backend also has an interactive page for trying each endpoint at http://localhost:8000/docs.

## More detail

- [frontend/README.md](frontend/README.md) explains where each part of the website code lives.
- [backend/README.md](backend/README.md) explains where each part of the API code lives.

## Keeping secrets safe

Never commit `backend/.env`, `frontend/.env` or any file downloaded from Google Cloud Console. They are listed in `.gitignore` for this reason. The `.env.example` files are safe to commit because they contain no real values.
