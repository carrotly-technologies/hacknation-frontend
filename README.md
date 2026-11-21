# hacknation-frontend

React + TypeScript + Vite frontend for HackNation. It talks to the NestJS API in
[hacknation-backend](https://github.com/carrotly-technologies/hacknation-backend).

## Setup

```bash
npm install
cp .env.example .env   # optional
```

| Variable       | Default | Description                                                                 |
| -------------- | ------- | --------------------------------------------------------------------------- |
| `VITE_API_URL` | empty   | Backend base URL. Empty = same origin, via the dev proxy `/api` -> `:3000`  |

## Run

Start the backend first (`npm run start:dev` in `hacknation-backend`, port 3000), then:

```bash
npm run dev       # http://localhost:5173
```

The home page calls `GET /api/health` and shows the API status, or an error
message when the backend is not reachable.

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
docker run --rm -p 8080:80 hacknation-frontend   # http://localhost:8080
```
