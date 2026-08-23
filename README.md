# FlowPilot

Visual workflow automation platform — trigger → condition → action graphs, built and monitored on a real execution engine (not a demo).

> **Status:** Phase 4 (Backend Execution Engine) code-complete but **not yet run against a live database** — no Supabase project exists yet. See the callout below before trusting any of this. AI features land in Phase 6. This README will grow into full documentation at Phase 10.

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

## Execution engine: what's verified and what isn't

⚠️ **This backend has not been run against a real database yet.** There is no Supabase project configured, so nothing in this section has executed against live Postgres — everything below is verified up to the point where a real `DATABASE_URL` becomes required.

**Actually verified:**
- Every new file passes `node --check` (no syntax errors) and the Fastify server boots cleanly.
- `/api/health` responds correctly with no database at all.
- DB-dependent routes (workflow save, execution trigger) fail *gracefully* with a clear 500 and a real Prisma connection error — no crash, no silent hang — when pointed at an unreachable database, which is the actual current state.
- The pg-boss worker's startup failure is caught and logged (`"execution worker not started"`) rather than crashing the whole server.

**Written but unverified against real data:** the workflow upsert transaction (replace nodes/edges, bump version), the execution engine's breadth-first traversal and condition-branch skipping, the SSRF guard's DNS-resolution check, and the retry/timeout wrapper around each node executor. The logic has been read through carefully and the shapes match the Prisma schema, but "compiles and the error path is graceful" is not the same claim as "produces a correct execution record" — that requires an actual Postgres instance, which is next once a Supabase project exists.

**To actually run this once you have a Supabase project:**
```bash
# apps/api/.env — set DATABASE_URL to your Supabase connection string, then:
npm run prisma:generate --workspace=apps/api
npm run prisma:migrate --workspace=apps/api
npm run dev:api
```

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Visual workflow editor (React Flow, undo/redo, command palette)
- [x] Phase 3 — Local-first (IndexedDB drafts, offline mode, sync)
- [ ] Phase 4 — Backend workflow execution engine (code-complete, unverified — no live database yet)
- [ ] Phase 5 — Execution inspector
- [ ] Phase 6 — AI node + AI workflow generation
- [ ] Phase 7 — Realtime execution updates (WebSockets)
- [ ] Phase 8 — Accessibility, responsive, performance polish
- [ ] Phase 9 — Tests
- [ ] Phase 10 — Production hardening, deployment, full docs

## License

Unlicensed — personal portfolio project.
