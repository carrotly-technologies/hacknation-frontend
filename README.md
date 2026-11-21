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
