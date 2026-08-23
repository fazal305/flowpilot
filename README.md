# FlowPilot

Visual workflow automation platform — trigger → condition → action graphs, built and monitored on a real execution engine (not a demo).

> **Status:** Phase 6 (AI node + AI workflow generation) built and verified end-to-end in the browser — with a mocked model, since no OpenRouter key is configured (see below). **No Supabase project exists yet**, so the execution engine itself is still unverified against real data. This README will grow into full documentation at Phase 10.

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

**Actually verified (in-browser, against a running API with no database):**
- The Fastify server boots, `/api/health` works with no database, and DB-dependent routes fail gracefully (clear 500, no crash) when Postgres is unreachable — this is genuinely the current state, not a simulated one.
- The frontend's error paths are real, not placeholders: the Executions list and the editor's Run button both surface the actual API error text inline instead of hanging or blanking the screen.
- The full **Save → Run → navigate to the execution page** flow was exercised against the live (DB-less) API and correctly stopped at "Internal server error." rather than pretending to succeed.

**Two real bugs this testing found and fixed**, worth naming because they'd have been invisible without actually running the code:
1. `app.setErrorHandler(...)` was registered *after* the route plugins in `app.js`. Fastify gives each `app.register()` call its own encapsulated context that only inherits what the parent had *at registration time* — so the error handler silently never applied to any route, and every unhandled error (including raw Prisma connection strings) was leaking to clients via Fastify's default error serializer instead of our sanitized one. Fixed by moving it before all `register()` calls.
2. `ExecutionsPage` destructured `useRecentExecutions()`'s `data` without a default, so before the first successful fetch it briefly rendered `undefined.length` and crashed the whole page to blank (caught by the new top-level `ErrorBoundary`, itself added because of this). Fixed with `data: executions = []`, matching the pattern already used elsewhere.

**Written but unverified against real data:** the workflow upsert transaction (replace nodes/edges, bump version), the execution engine's breadth-first traversal and condition-branch skipping, the SSRF guard's DNS-resolution check, and the retry/timeout wrapper around each node executor. The logic has been read through carefully and the shapes match the Prisma schema, but "compiles and the error path is graceful" is not the same claim as "produces a correct execution record" — that requires an actual Postgres instance, which is next once a Supabase project exists.

**To actually run this once you have a Supabase project:**
```bash
# apps/api/.env — set DATABASE_URL to your Supabase connection string, then:
npm run prisma:generate --workspace=apps/api
npm run prisma:migrate --workspace=apps/api
npm run dev:api
```

## AI: architecture and current state

**Architecture matches the brief exactly:** React frontend → Fastify backend → OpenRouter → backend → frontend. `OPENROUTER_API_KEY` lives only in `apps/api/.env` (gitignored) and is read once in `apps/api/src/services/openRouterService.js` — the frontend never sees it, never could see it, and no frontend code references it.

**Without a key configured** (the current state — nobody has supplied one), both AI features return clearly-labeled mocked output rather than silently pretending to call a model:
- The **AI node**, when a workflow executes, returns `{ mocked: true, note: "...", summary: "[mock] ..." }`.
- **AI workflow generation** returns a fixed example graph with `meta.mocked: true`, and the dialog shows a visible banner saying so before the user ever opens it in the editor.

**With a key configured**, both call OpenRouter for real: the AI node via `anthropic/claude-3.5-haiku` (configurable per-node) with token/latency accounting, and generation via a system prompt constrained to strict JSON using only the six node types, parsed and schema-validated (`apps/api/src/services/generatedGraphValidator.js`) before ever reaching the frontend — an AI response with an invented node type or malformed structure is rejected, not passed through.

**Verified in-browser (mocked path):** command palette → dialog → generate → preview (name, node/edge count, mock notice) → "Open in editor" → the generated graph loads into a real, editable draft, autosaves locally, and passes the same validator every hand-built workflow does. Confirmed the dialog renders correctly (it lives outside `<main>`, so page-text-only checks miss it — verified via the full accessibility tree instead). Also confirmed a banner-persistence bug: the editor's per-workflow-id remount (the Phase 3 fix) was wiping a naive `useState` "just generated" flag right after the first autosave. Fixed by moving that flag into the persistent editor store and the saved IndexedDB record instead of component state.

**User confirmation before execution:** the brief requires AI-generated workflows never execute silently. FlowPilot doesn't special-case this with an extra dialog — a generated graph lands in the *same* editor as any hand-built one, autosaves as a local draft (not an execution), and requires the same explicit Run click and passing validation as every other workflow. Manual review before running is the existing architecture, not a bolt-on.

**Prompt-injection consideration:** the AI node's `userPromptTemplate` can embed upstream node output (e.g. form submission text) that a user doesn't control. The system prompt explicitly instructs the model to treat that content as data to summarize, never as instructions to follow. More fundamentally, nothing about executing a workflow trusts the AI's output structurally — an HTTP Request node's URL still goes through the SSRF guard, a Notification node's channel is still schema-validated — identically whether the graph came from AI generation or was hand-built.

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Visual workflow editor (React Flow, undo/redo, command palette)
- [x] Phase 3 — Local-first (IndexedDB drafts, offline mode, sync)
- [ ] Phase 4 — Backend workflow execution engine (code-complete, unverified — no live database yet)
- [ ] Phase 5 — Execution inspector (built, wired to real API, run-a-workflow path untested end-to-end without a database)
- [x] Phase 6 — AI node + AI workflow generation (verified end-to-end with a mocked model; real OpenRouter calls unverified — no key configured)
- [ ] Phase 7 — Realtime execution updates (WebSockets)
- [ ] Phase 8 — Accessibility, responsive, performance polish
- [ ] Phase 9 — Tests
- [ ] Phase 10 — Production hardening, deployment, full docs

## License

Unlicensed — personal portfolio project.
