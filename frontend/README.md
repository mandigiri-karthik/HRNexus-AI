# Frontend

React app (Vite, plain JavaScript) with sign-up, log-in and Google sign-in pages.

## Run it

```bash
cp .env.example .env   # first time only, then fill in the values
npm install
npm run dev            # http://localhost:8080
```

The backend must be running too (see `../backend/README.md`).

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm run build` | Makes a production build in `dist/` |
| `npm run lint` | Checks the code for mistakes |

## Where things are

| Path | What it does |
| --- | --- |
| `src/main.jsx` | Starts the app and wraps it in the providers |
| `src/App.jsx` | The list of pages (routes) |
| `src/pages/` | One file per page: login, sign-up, dashboard |
| `src/components/AuthForm.jsx` | The form shared by the login and sign-up pages |
| `src/components/ProtectedRoute.jsx`, `GuestRoute.jsx` | Decide who may see a page |
| `src/context/` | The logged-in session, shared with every component |
| `src/services/api.js` | Every call to the backend |
| `src/config.js` | Settings read from `.env` |
| `src/styles/index.css` | All the styling |
