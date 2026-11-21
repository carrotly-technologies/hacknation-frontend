# hacknation-frontend

React + TypeScript + Vite frontend for HackNation. It talks to the NestJS API in
[hacknation-backend](https://github.com/carrotly-technologies/hacknation-backend).

## Setup

```bash
npm install
cp .env.example .env   # optional
```

| Variable             | Default | Description                                                                                       |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`       | empty   | Backend base URL. Empty = same origin, via the dev proxy `/api` -> `:3000`                        |
| `VITE_DEMO_ACCOUNTS` | empty   | `false` hides the demo accounts (one-click sign-in) on `/logowanie`; anything else shows them     |

Both are read at build time (`npm run build`, Docker build args).

## Run

Start the backend first (`npm run start:dev` in `hacknation-backend`, port 3000), then:

```bash
npm run dev       # http://localhost:5173
```

The app is **Kompas Kompetencji** (UI in Polish), a work tool for civil-service
supervisors and HR, built around the assessment file ("teczka oceny"):

- `/logowanie` — sign-in with login and password; the role (supervisor, HR, admin) comes from the account
  (demo accounts: backend README; below the form one card per demo account signs in with one click,
  list in `src/lib/demoAccounts.ts`, hidden with `VITE_DEMO_ACCOUNTS=false`). The token sits in `sessionStorage` and goes with every API call
  (`Authorization: Bearer`); a 401 sends you back to sign-in. Routes and the menu depend on the role, and a
  route for another role redirects to your start page (`src/lib/useAuth.ts`, `src/shell/RequireAuth.tsx`);
- `/admin/uzytkownicy` — admin only: accounts and their roles;

- `/zespol` — my team: deadline-driven to-do list and team table;
- `/teczka/:id/:stage` — the case file: stage rail (periodic and first-assessment paths), stage workspaces
  (OSP analysis, the "Formularz oceny" sheet wizard filled part by part — parts I, II, III, current part in `?czesc=` — observations, rubric assessment with system suggestion and supervisor
  decision, justification/IPRZ with formal check, document), docked assistant panel;
- `/teczka/:id/arkusz` — official sheet preview (parts I/II/III); print it to get the PDF;
- `/hr` — HR monitoring with counters, filters and (simulated) reminders; `/baza-wiedzy` — assistant;
- `/ustawienia` — appearance settings for every role (gear icon in the top bar; on phones in "Menu"): theme
  system/light/dark, text size 100/125/150%, high contrast. Kept only in this browser (`localStorage`
  `kompas.prefs`, `src/lib/preferences.ts`) and applied before the first paint by a small script in `index.html`;
- `/ui` — design-system catalogue, `/wniosek-demo` — step-by-step form pattern, `/wiecej`, `/uslugi`
  (helper pages: they work under their addresses but are not linked from the navigation).

API contract: `notatki/api-kontrakt-v1.md` and `api-kontrakt-v2.md` (+ `availableActions` extension).
The assistant is a stub: wire `askAssistant()` in `src/api/assistant.ts`. Data fetching uses TanStack
Query, routing react-router; design tokens live in `src/styles/tokens.css`,
components in `src/components/ui/`; see `docs/DESIGN.md`.

Without a backend you can use a dev-only mock (off by default, never bundled):

```bash
MOCK_API=1 npm run dev   # serves v1 + v2 /api/* (dev-mock-api.ts, dev-mock-v2.ts); any password, login a.lis = HR, admin = ADMIN
```

## Quality

```bash
npm run lint      # oxlint
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build
```

## Deploy

Production runs on Coolify (project **Hackathons**, environment `production`)
as the `hacknation-frontend` application, built from this repo's `Dockerfile`
(Vite build, then nginx serving `dist/` with an SPA fallback to `index.html`):

- URL: <https://hacknation.rabbithole.carrotly.tech>
- API: <https://api.hacknation.rabbithole.carrotly.tech>, passed as the
  `VITE_API_URL` build arg (set as a build-time variable in Coolify). It is
  baked into the bundle, so changing it needs a redeploy.
- Every push to `main` triggers a new deploy (GitHub App source, auto-deploy on).

Build and run the image locally:

```bash
docker build --build-arg VITE_API_URL=http://localhost:3000 -t hacknation-frontend .
# add --build-arg VITE_DEMO_ACCOUNTS=false to build without the demo accounts
docker run --rm -p 8080:80 hacknation-frontend   # http://localhost:8080
```
