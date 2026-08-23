# FlowPilot

Visual workflow automation platform — trigger → condition → action graphs, built and monitored on a real execution engine (not a demo).

> **Status:** Phase 3 (Local-First) complete. The execution engine and AI features land in later phases — see the roadmap below. This README will grow into full documentation at Phase 10.

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

## Local-first: current state and limitations

Workflows are drafted straight to IndexedDB (`apps/web/src/lib/db.js`) — every save, including the very first autosave of a brand-new workflow, is a real write to the browser's database, not a stub. The editor works fully offline; an offline badge appears in the toolbar and topbar when the browser goes offline.

**What's real:** local persistence, autosave, offline detection, duplicate/delete, and a version-comparison algorithm (`packages/shared/src/sync.js`) that decides push/pull/conflict from three version numbers.

**What's not built yet:** there is no server to sync *with* — that arrives with the backend in Phase 4. Until then every draft's `syncStatus` is `local-only`, and the conflict-resolution algorithm exists but isn't wired to a live comparison. This is deliberately scoped as last-write-wins-with-warning once sync is live, not CRDT-based real-time collaborative merging — true concurrent multi-user editing of the same graph is out of scope for this project.

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Visual workflow editor (React Flow, undo/redo, command palette)
- [x] Phase 3 — Local-first (IndexedDB drafts, offline mode, sync)
- [ ] Phase 4 — Backend workflow execution engine
- [ ] Phase 5 — Execution inspector
- [ ] Phase 6 — AI node + AI workflow generation
- [ ] Phase 7 — Realtime execution updates (WebSockets)
- [ ] Phase 8 — Accessibility, responsive, performance polish
- [ ] Phase 9 — Tests
- [ ] Phase 10 — Production hardening, deployment, full docs

## License

Unlicensed — personal portfolio project.
