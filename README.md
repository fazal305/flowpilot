# FlowPilot

Visual workflow automation platform — trigger → condition → action graphs, built and monitored on a real execution engine (not a demo).

> **Status:** Phase 9 (Tests) — 87 tests across all three workspaces, all passing, covering every unit of pure logic reachable without a live database. This README will grow into full documentation at Phase 10.

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

## Realtime: architecture and current state

Live execution updates use WebSockets specifically because that's the one place in this app where "genuinely adds value" is unambiguous: a running workflow's status changes on the server, on its own timeline, and the person watching the execution page wants to see that the moment it happens rather than on a poll cycle. Nothing else in the app is pushed over WebSockets.

**How it works:** `apps/api/src/realtime/executionHub.js` is an in-memory `Map<executionId, Set<socket>>`. The execution engine calls a one-line `notify(executionId, type)` at each meaningful transition (execution running, each node started/finished, execution finished) — the message carries no payload beyond "something changed," deliberately. The already-correct, already-tested REST endpoint (`GET /api/executions/:id`) stays the single source of truth for what an execution actually looks like; the socket's only job is telling the frontend to go re-fetch it sooner than the 4-second poll backstop would. `useExecutionSocket` on the frontend does exactly that: on any message, invalidate the query.

**Honest architectural limitation:** this only works because the API server and the pg-boss worker run in the same Node process (see `server.js`) — a broadcast from the worker reaches sockets held by that same process's memory. If this were ever horizontally scaled (multiple API instances, or the worker split onto its own machine), a broadcast from one instance would never reach a socket connected to another. Fixing that needs a shared channel across instances (Redis pub/sub, or Postgres `LISTEN`/`NOTIFY`) — not built, because there's only one process today and building a multi-instance fanout mechanism with no way to actually run multiple instances to test it against would be exactly the kind of unverifiable code this project is trying not to write.

**What's verified:** connected directly to `ws://localhost:4000/ws/executions/:id` from a browser tab and confirmed the connection opens and the initial `{"type":"connected"}` acknowledgment arrives — this needs no database. The poll backstop still degrades correctly to a working (if slower) UI if the socket never connects. **What's not verified:** an actual `notify()` call firing during a real execution — that requires the execution engine to run at all, which needs Postgres.

**A real bug found while testing this:** navigating to a nonexistent execution ID surfaced a genuine gap unrelated to WebSockets — `ExecutionDetailPage` had no handling for the state where a query has failed once, isn't retrying yet, and hasn't reached `isError` (TanStack Query's `fetchStatus: "paused"`, which a real flaky connection can produce, not just a test artifact). The page rendered a blank `<main>` in that state. Fixed by treating it the same as the loading state instead of assuming "not loading and not errored" always means "has data."

## Accessibility, responsive, performance: what this pass actually covers

The brief's Phase 8 scope is large enough to be its own project. This pass fixed real, verified gaps rather than attempting exhaustive coverage of every possible item — scoped honestly rather than claiming a full audit that didn't happen.

**Fixed, real gaps:**
- **No mobile navigation at all.** The Sidebar hides below the `md` breakpoint (correctly — the editor genuinely needs the width), but there was no replacement, so a phone user had zero way to move between Dashboard/Workflows/Executions/Settings. Added a hamburger-triggered drawer (`MobileNav.jsx`).
- **No focus management in dialogs.** `Dialog.jsx` (used by the AI generator and shortcuts reference) had no focus trap, no initial focus, no focus restoration on close — a keyboard or screen-reader user could tab out behind the overlay. Added `useFocusTrap`, verified: focus moves in on open, Tab cycles within the dialog, closing restores focus to whatever opened it.
- **Editor on small screens showed a broken, unusably cramped canvas.** Added an explicit notice below 768px pointing back to the (fully usable) workflow list, rather than pretending touch-dragging a node graph on a phone works.
- **React Flow re-renders every node on any canvas change.** Wrapped the custom node component in `React.memo` — a justified fix given graphs can have several nodes, not blind memoization.
- **Loading-state flicker.** IndexedDB reads usually resolve in a few milliseconds; showing "Loading…" unconditionally just flashes for a frame. Added `useDelayedFlag` (200ms) so fast loads show nothing and only genuinely slow ones show feedback.
- **Stale copy.** A few strings still said "arrives in Phase 4" for phases that had since shipped (or, for auth, still accurately describes what's not wired yet) — corrected to describe actual current behavior.

**A real bug found while testing this, unrelated to what was being tested:** verifying the mobile breakpoint transition live exposed that this specific automated browser tool's viewport resize doesn't dispatch either `matchMedia`'s `change` event or `window`'s `resize` event (confirmed directly: `matches` updates correctly, no event fires) — a CDP viewport-override quirk, not real-browser behavior, but `useMediaQuery` only listened for the `change` event. Added a `resize` listener as a fallback for robustness regardless of which environment actually needs it; verified the mobile/desktop transition is otherwise correct by checking fresh mounts at each size.

**Deliberately not attempted in this pass** (real gaps, just not part of this pass's honest scope): a full color-contrast audit against WCAG numbers, screen-reader testing with an actual AT (NVDA/VoiceOver), a systematic reduced-motion audit component-by-component (the global CSS rule in `tokens.css` covers the common case), and virtualization for long lists (none of the current lists are long enough to need it yet).

## Testing

```bash
npm test   # runs packages/shared, apps/api, then apps/web in sequence
```

No test framework was added as a dependency — Node 24's built-in `node:test` and `node:assert/strict` cover everything needed here, which fits a codebase already trying not to add dependencies it doesn't need.

**87 tests, all passing:**
- **`packages/shared`** (12) — workflow graph validation (missing trigger, disconnected nodes, condition branch coverage, cycle detection) and the sync conflict-decision algorithm (push/pull/conflict/none from three version numbers).
- **`apps/api`** (71) — condition evaluation (every operator, dot-path lookups, missing-path handling), execution graph traversal (adjacency, trigger detection, branch selection, skipped-descendant calculation), the retry/timeout wrapper (mocking `fetch` to prove a failing `httpRequest` node actually retries with backoff and eventually gives up with the right retry count — not just that the code compiles), the SSRF guard (every private IP range, cloud metadata address, IPv6 loopback, localhost — all via IP literals, no real DNS lookups so the suite isn't network-dependent), password hashing and JWT session round-trips, every zod validator (workflow upsert, AI prompt, register/login), and the AI-generated-graph validator (unknown node types rejected, missing config fields backfilled with the same defaults the editor uses, dangling edges dropped).
- **`apps/web`** (4) — the React-Flow-shape ↔ shared-graph-shape adapter round-trips correctly.

**What isn't covered, and why:** anything that touches Prisma directly — `workflowRepository`, `executionRepository`, `workspaceRepository`, and by extension `executionEngine.js`'s actual database writes — has no automated tests, because there is no database to test against yet. Mocking Prisma to fake success would test the mock, not the code; the honest state is "this logic has been read carefully and matches the schema, and will get real test coverage once a Supabase project exists to run integration tests against." Frontend component/interaction tests (React Testing Library et al.) also aren't included — the interactive behavior (node CRUD, drag/connect, dialogs, keyboard shortcuts) was instead verified by actually driving the running app in a browser during Phases 2–8, which is documented inline in each phase's commit rather than encoded as an automated suite here.

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Visual workflow editor (React Flow, undo/redo, command palette)
- [x] Phase 3 — Local-first (IndexedDB drafts, offline mode, sync)
- [ ] Phase 4 — Backend workflow execution engine (code-complete, unverified — no live database yet)
- [ ] Phase 5 — Execution inspector (built, wired to real API, run-a-workflow path untested end-to-end without a database)
- [x] Phase 6 — AI node + AI workflow generation (verified end-to-end with a mocked model; real OpenRouter calls unverified — no key configured)
- [x] Phase 7 — Realtime execution updates (WebSocket route verified live; broadcasts from the execution engine unverified — no database)
- [x] Phase 8 — Accessibility, responsive, performance (scoped pass — see above for exactly what's covered)
- [x] Phase 9 — Tests (87 passing; DB-touching code untested — no live database yet)
- [ ] Phase 10 — Production hardening, deployment, full docs

## License

Unlicensed — personal portfolio project.
