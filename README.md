# FlowPilot

Visual workflow automation platform — trigger → condition → action graphs, built and monitored on a real execution engine (not a demo).

> **Status:** Phase 2 (Visual Workflow Editor) complete. The execution engine, local-first sync, and AI features land in later phases — see the roadmap below. This README will grow into full documentation at Phase 10.

## Stack

- **Frontend:** Vite, React, JavaScript (JSX), Tailwind CSS v4, React Flow, Zustand, TanStack Query, IndexedDB
- **Backend:** Node.js, Fastify, JavaScript, PostgreSQL via Prisma, pg-boss (Postgres-backed job queue)
- **AI:** OpenRouter (backend-only — key never reaches the frontend)
- **Deploy:** Frontend on Netlify, API on Fly.io, database on Supabase

## Project layout

```
flowpilot/
  apps/
    web/     # React frontend
    api/     # Fastify backend
  packages/
    shared/  # node/workflow/execution shapes shared by both apps
```

## Development

```bash
npm install
npm run dev:web   # http://localhost:5173
npm run dev:api   # http://localhost:4000
```

Copy `apps/web/.env.example` → `apps/web/.env` and `apps/api/.env.example` → `apps/api/.env`, then fill in real values. Never commit `.env`.

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Visual workflow editor (React Flow, undo/redo, command palette)
- [ ] Phase 3 — Local-first (IndexedDB drafts, offline mode, sync)
- [ ] Phase 4 — Backend workflow execution engine
- [ ] Phase 5 — Execution inspector
- [ ] Phase 6 — AI node + AI workflow generation
- [ ] Phase 7 — Realtime execution updates (WebSockets)
- [ ] Phase 8 — Accessibility, responsive, performance polish
- [ ] Phase 9 — Tests
- [ ] Phase 10 — Production hardening, deployment, full docs

## License

Unlicensed — personal portfolio project.
