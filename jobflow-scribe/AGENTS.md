<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All backend calls go through `src/lib/api.ts`; each function branches on `USE_MOCK` (mock store in `src/mocks/store.ts`) vs real FastAPI fetch — so the real backend can be swapped in without UI changes.
- Auth token and journey progress live in sessionStorage via `src/lib/session.ts`; protected pages sit under `src/routes/_authenticated` (client-only, redirects to /login).
- TS strictness: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature` are off — they fight TanStack search params and shadcn patterns.
