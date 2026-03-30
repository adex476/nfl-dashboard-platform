# NFL Scout Dashboard — Monorepo

Turborepo + React + Vite + TypeScript monorepo for the NFL analytics dashboard.

## Structure

```
nfl-dashboard/
├── apps/
│   └── dashboard/          ← React + Vite app (port 3000)
├── packages/
│   ├── api-client/         ← Typed clients for Data Lake (:8000) + Models (:8001)
│   ├── types/              ← Shared TypeScript types (Player, PredictionResult, etc.)
│   └── ui/                 ← Shared components (Card, Badge, StatBlock, Spinner)
├── turbo.json              ← Turborepo task pipeline
├── ecosystem.config.cjs    ← PM2 production config
└── package.json            ← Workspace root
```

## Quick Start

```bash
# 1. Install everything (run once from root)
npm install

# 2. Copy env file
cp apps/dashboard/.env.example apps/dashboard/.env

# 3. Start dev server (hot reload on port 3000)
npm run dev

# 4. Build for production
npm run build

# 5. Run in production with PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup   # register as system service
```

## Pages

| Route       | Purpose                                    |
|-------------|-------------------------------------------|
| /overview   | KPIs — data lake health, model status     |
| /players    | Browse & filter players from data lake    |
| /models     | Run predictions, view SHAP values         |
| /nullclaw   | Chat with NullClaw (Claude assistant)     |
| /query      | Raw SQL interface against DuckDB          |

## Adding a new page

1. Create `apps/dashboard/src/pages/MyPage.tsx`
2. Add the route in `App.tsx`
3. Add the nav entry in `AppShell.tsx`

## Shared packages

- `@nfl/types` — import types across the whole monorepo
- `@nfl/api-client` — `dataLake.players()`, `modelApi.predict()`, `modelApi.nullclaw()`
- `@nfl/ui` — `<Card>`, `<Badge>`, `<StatBlock>`, `<Spinner>`
