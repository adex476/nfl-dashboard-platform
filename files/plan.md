# NFL Dashboard — Implementation Plan

**Goal**: A React dashboard that surfaces the data lake, ML model predictions, and NullClaw chat in one place.
**Data source**: `nfl-data-platform` REST API at `http://localhost:8000`
**Model source**: `nfl-model-platform` FastAPI at `http://localhost:8001`
**Scope**: Frontend only.

---

## How this fits into the overall system

```
nfl-data-platform  (:8000)  ←── DuckDB + Neo4j + FastAPI
nfl-model-platform (:8001)  ←── 7 ML models + NullClaw + FastAPI
nfl-dashboard      (:3000)  ←── This repo. React UI connecting to both.
```

The dashboard does not process data or run models. It calls the APIs and displays results.

---

## Progress

| Phase | Description                                               | Status                          |
| ----- | --------------------------------------------------------- | ------------------------------- |
| 1     | Monorepo scaffold (Turborepo + Vite + TypeScript)         | ✅ Done                         |
| 2     | Shared types package (`@nfl/types`)                       | ✅ Done                         |
| 3     | API client package (`@nfl/api-client`)                    | ✅ Done                         |
| 4     | Shared UI components (`@nfl/ui`)                          | ✅ Done                         |
| 5     | App shell — sidebar, routing, health indicators           | ✅ Done                         |
| 6     | Overview page — service status, model registry, data flow | ✅ Done                         |
| 7     | Players page — filterable table from data lake            | ✅ Done (stub, needs live data) |
| 8     | Models page — prediction runner with SHAP visualization   | ✅ Done (stub, needs live API)  |
| 9     | NullClaw page — chat UI wired to `/nullclaw/chat`         | ✅ Done (stub, needs live API)  |
| 10    | SQL Query page — DuckDB passthrough with result table     | ✅ Done (stub, needs live API)  |
| 11    | Wire all pages to live APIs                               | 🔲 Pending                      |
| 12    | Charts and visualizations                                 | 🔲 Pending                      |
| 13    | Player detail page                                        | 🔲 Pending                      |
| 14    | Production deploy with PM2                                | 🔲 Pending                      |

---

## Repository Structure

```
nfl-dashboard/
├── apps/
│   └── dashboard/                        # The React app — runs on port 3000
│       ├── src/
│       │   ├── App.tsx                   # Route definitions
│       │   ├── main.tsx                  # React entry point
│       │   ├── index.css                 # Global CSS variables + resets
│       │   ├── components/
│       │   │   └── layout/
│       │   │       ├── AppShell.tsx      # Sidebar + main layout wrapper
│       │   │       └── AppShell.module.css
│       │   ├── hooks/
│       │   │   └── useApiHealth.ts       # Polls :8000 and :8001 every 15s
│       │   └── pages/
│       │       ├── OverviewPage.tsx      # Status cards, model registry, data flow
│       │       ├── PlayersPage.tsx       # Sortable/filterable player table
│       │       ├── ModelsPage.tsx        # Prediction runner + SHAP bar chart
│       │       ├── NullClawPage.tsx      # Chat UI → /nullclaw/chat
│       │       └── QueryPage.tsx         # SQL editor → /query passthrough
│       ├── index.html                    # HTML entry point (loads fonts)
│       ├── vite.config.ts                # Vite config + dev proxy to :8000/:8001
│       └── .env.example                  # Copy to .env, set API URLs
│
├── packages/                             # Shared code — imported by apps
│   ├── types/
│   │   └── src/index.ts                  # Player, TeamStats, ModelName, PredictionResult, etc.
│   ├── api-client/
│   │   └── src/index.ts                  # DataLakeClient + ModelClient (typed fetch wrappers)
│   └── ui/
│       └── src/                          # Card, Badge, StatBlock, Spinner components
│
├── turbo.json                            # Turborepo task pipeline (build order)
├── ecosystem.config.cjs                  # PM2 config for production
├── package.json                          # Workspace root + npm scripts
└── plan.md                               # This file
```

---

## Shared Packages

### `@nfl/types`

TypeScript definitions shared across the whole monorepo. Any time the shape of a Player or PredictionResult changes, you change it here once.

Key types:

- `Player` — combine data fields (name, position, forty, bench, etc.)
- `TeamStats` — season-level team performance
- `ModelName` — union of all 7 model keys
- `PredictionResult` — score, confidence, shap_values
- `NullClawMessage` / `NullClawResponse` — chat message format

### `@nfl/api-client`

Two typed clients. Import and call — no raw fetch() in page components.

```ts
import { dataLake, modelApi } from "@nfl/api-client";

// Data lake examples
await dataLake.players("WR", 2025)         // GET /players?position=WR&year=2025
await dataLake.query("SELECT * FROM ...")  // POST /query
await dataLake.health()                    // GET /health

// Model platform examples
await modelApi.predict({ model: "player_projection", inputs: { ... } })
await modelApi.nullclaw(messages)          // POST /nullclaw/chat
await modelApi.health()                    // GET /health
```

### `@nfl/ui`

Shared visual components. All respect the CSS variables defined in `index.css`.

| Component     | Purpose                                               |
| ------------- | ----------------------------------------------------- |
| `<Card>`      | Surface container with optional accent glow           |
| `<Badge>`     | Colored label pill (accent / gold / danger / success) |
| `<StatBlock>` | Big number display with label and sub-text            |
| `<Spinner>`   | Loading indicator                                     |

---

## Pages

### Overview (`/overview`)

- Live status cards for Data Lake, Model Platform, NullClaw
- Model registry grid — shows ready vs pending for all 7 models
- Data flow diagram — visual reminder of the pipeline
- Status dots update automatically via `useApiHealth` hook

### Players (`/players`)

- Pulls from `GET /players` on the data lake
- Filter by position (QB, RB, WR, TE, etc.)
- Search by name or college
- Sortable columns — click any header to sort
- Handles offline state gracefully with error card

### Models (`/models`)

- Sidebar lets you pick which model to run
- Form fields auto-populate based on selected model
- On submit: calls `POST /predict/{model}` on model platform
- Result shows score, confidence, and SHAP feature importance bar chart
- Currently has: Player Projection, Health Analyzer, Draft Optimizer
- Add more models here as they come online in `nfl-model-platform`

### NullClaw (`/nullclaw`)

- Full chat interface
- Sends conversation history to `POST /nullclaw/chat`
- NullClaw routes questions to the right ML model as a tool internally
- Suggestion prompts on empty state to help users get started
- Animated thinking indicator while waiting for response

### SQL Query (`/query`)

- Direct DuckDB passthrough via `POST /query` on data lake
- Example queries pre-loaded as clickable chips
- ⌘ + Enter (or Ctrl + Enter) to run
- Results rendered in a scrollable table
- Shows query execution time

---

## Design System

All colors defined as CSS variables in `apps/dashboard/src/index.css`.

| Variable         | Value         | Usage                           |
| ---------------- | ------------- | ------------------------------- |
| `--bg-base`      | `#080c10`     | Page background                 |
| `--bg-surface`   | `#0e1420`     | Cards, sidebar                  |
| `--bg-elevated`  | `#161e2e`     | Inputs, hover states            |
| `--accent`       | `#00d4ff`     | Active nav, highlights, borders |
| `--accent-gold`  | `#f0b429`     | Secondary accent                |
| `--success`      | `#00c48c`     | Online indicators               |
| `--danger`       | `#ff4d6d`     | Offline, errors                 |
| `--font-display` | Bebas Neue    | Page headings                   |
| `--font-body`    | IBM Plex Sans | All body text                   |
| `--font-mono`    | IBM Plex Mono | Code, stats, ports              |

---

## Dev Setup

```bash
# Clone
git clone https://github.com/adex476/nfl-dashboard-platform.git
cd nfl-dashboard-platform

# Install all packages across the monorepo
npm install

# Configure environment
cp apps/dashboard/.env.example apps/dashboard/.env
# Edit .env if your APIs run on different ports

# Start dev server (hot reload on port 3000)
npm run dev
```

The dashboard works without the Python servers running — pages show offline error states. Start your Python servers and the status dots go green automatically.

---

## Environment Variables

`apps/dashboard/.env`:

```
VITE_DATA_LAKE_URL=http://localhost:8000
VITE_MODEL_API_URL=http://localhost:8001
```

Change these if you deploy the APIs to a remote server. Never commit `.env` — it's gitignored.

---

## Adding a New Page

1. Create `apps/dashboard/src/pages/MyPage.tsx`
2. Add the route in `App.tsx`:
   ```tsx
   <Route path="/my-page" element={<MyPage />} />
   ```
3. Add the nav entry in `AppShell.tsx`:
   ```tsx
   { to: "/my-page", label: "My Page", icon: "◇" }
   ```

---

## Adding a New Model to the Models Page

When a new model comes online in `nfl-model-platform`, add it to the `MODELS` array in `ModelsPage.tsx`:

```ts
{
  name: "team_diagnosis",         // must match ModelName in @nfl/types
  label: "Team Diagnosis",
  description: "Multi-task XGBoost — positional weakness scores.",
  fields: [
    { key: "team",   label: "Team",   type: "text",   placeholder: "DAL" },
    { key: "season", label: "Season", type: "number", placeholder: "2024" },
  ],
}
```

That's all — the form, submission, and result display are handled automatically.

---

## Production Deploy

```bash
# Build everything
npm run build

# Start with PM2 (keeps it alive, auto-restarts on crash)
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup    # register as system service so it survives reboots
```

---

## Tech Stack

| Tool                  | Purpose                                |
| --------------------- | -------------------------------------- |
| React 18              | UI component framework                 |
| TypeScript            | Type safety across the whole monorepo  |
| Vite 5                | Dev server + production bundler        |
| React Router 6        | Client-side page routing               |
| Recharts              | Charts and data visualization          |
| Turborepo             | Monorepo build orchestration + caching |
| PM2                   | Production process management          |
| IBM Plex + Bebas Neue | Typography                             |
