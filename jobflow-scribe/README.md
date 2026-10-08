# Career Access

An AI career agent that helps people with overseas work experience find realistic careers and jobs in the UK. All data in this repo is fictional.

## Run it

You need Node.js 22 or newer.

```bash
cd jobflow-scribe
npx bun install
npm run dev
```

Open the URL printed in the terminal. If you have [bun](https://bun.sh) installed, `bun install` and `bun run dev` work too.

The app runs on mock data by default, so you don't need the backend. Log in to load the demo persona "Amira Haddad", or sign up to start with an empty profile. Mock data resets when you close the tab.

## Settings

All settings are optional. To change one, create a `.env.local` file in this folder:

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000
VITE_ELEVENLABS_AGENT_ID=
```

- `VITE_USE_MOCK`: set to `false` to call the real FastAPI backend. Defaults to `true`.
- `VITE_API_BASE_URL`: where the backend is running. Defaults to `http://localhost:8000`.
- `VITE_ELEVENLABS_AGENT_ID`: turns on the live voice interview.

Restart `npm run dev` after changing the file.

## Other commands

| Command | What it does |
| --- | --- |
| `npm run test` | Runs the tests |
| `npm run lint` | Checks code style |
| `npm run format` | Fixes code style |
| `npm run build` | Makes a production build |

## More

- Pages live in `src/routes/`. Pages that need a login are in `src/routes/_authenticated/`.
- All backend calls go through `src/lib/api.ts`. Mock data is in `src/mocks/`.
- The API contract and known limitations are in [docs/backend.md](docs/backend.md).
