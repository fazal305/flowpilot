# FlowPilot

A visual workflow automation platform — build trigger → condition → action graphs on a node-based canvas, run them on a real execution engine, and watch each run node-by-node as it happens. Inspired by tools like Zapier and n8n, not a clone of either.

**Live:**
- Frontend: [flowpilot-fazal305.netlify.app](https://flowpilot-fazal305.netlify.app) — site created, deploy currently blocked by the account's Netlify credit limit (see [Deployment](#deployment)).
- Backend: not deployed — no Supabase (database) or Fly.io (API host) project exists yet.
- Repository: [github.com/fazal305/flowpilot](https://github.com/fazal305/flowpilot) (public)

## Screenshots

Not included yet — the frontend deploy is blocked (see above), and screenshots of a partially-live app would be more misleading than useful. Run it locally (see [Setup](#setup)) to see it directly; this section will be filled in once the app is live.

## Product overview

A workflow is a graph of six node types:

| Category | Node | Does |
|---|---|---|
| Trigger | **Webhook** | Starts a run from an inbound HTTP request |
| Trigger | **Schedule** | Starts a run on a cron schedule |
| Logic | **Condition** | Branches into True/False paths based on a field comparison |
| Action | **HTTP Request** | Calls an external endpoint (SSRF-guarded) |
| Action | **AI** | Summarizes/transforms data via an LLM (OpenRouter) |
| Action | **Notification** | Sends an in-app, email, or outbound-webhook notification |

Example: a webhook receives a new lead, a condition checks whether their budget exceeds a threshold, and the true/false branches route to different notifications — optionally with an AI node summarizing the lead first. You can also describe a workflow in plain English and have AI generate a first draft graph, which you review and edit like any other workflow before ever running it.

## Architecture

### Frontend

Vite + React (plain JS/JSX, no TypeScript) + Tailwind CSS v4, organized by feature (`src/features/{workflows,executions,ai,auth}`) rather than by file type. State is deliberately split by concern: **Zustand** (`editorStore`) owns transient canvas/editor state (nodes, edges, undo history, save status); **TanStack Query** owns everything that comes from a server or IndexedDB (workflow lists, execution status, AI generation results) with its own cache, retry, and polling behavior. The canvas is [`@xyflow/react`](https://reactflow.dev); custom node components are `React.memo`-wrapped since React Flow re-renders every node on any canvas change.

### Backend

Node.js + Fastify (plain JS), layered as routes → controllers → services → repositories → Prisma. `app.setErrorHandler` is registered *before* any route plugin — Fastify gives each `register()` call its own encapsulated context that only inherits what the parent had *at registration time*, so registering the error handler after routes would have silently left it inapplicable to any of them (a real bug this project hit and fixed; see [Known limitations](#known-limitations-and-honest-status)).

### Workflow execution architecture

```
Workflow definition (Prisma: WorkflowNode/WorkflowEdge)
  → validateGraph() — shared logic, runs identically in the editor and here
  → pg-boss queue (Postgres-backed — no Redis) enqueues { executionId, workflowId, triggeredBy }
  → worker (same process as the API — see limitation below) picks up the job
  → executionEngine walks the graph breadth-first from the trigger node(s)
      → each node: runNode() wraps its executor with a per-type timeout and,
        for external-facing types (httpRequest/ai/notification), retry with
        exponential backoff
      → a condition node's untaken branch (and everything only reachable
        through it) is recorded SKIPPED, not silently absent
  → every node/execution transition writes a row (WorkflowExecution,
    NodeExecution, ExecutionLog) AND calls a one-line notify() that pushes
    a "something changed" WebSocket message — the REST endpoint stays the
    single source of truth for what an execution actually looks like; the
    socket's only job is telling the frontend to refetch sooner than its
    4-second poll backstop would
```

Each run gets a real execution id (`RUN #<id>` in the inspector), with per-node status/duration/input/output and structured logs — this is a real queued/worked execution model, not `setTimeout` pretending to be one.

### Database architecture

PostgreSQL via Prisma. `users` / `workspaces` / `workspace_members` exist in the schema, but the frontend doesn't have real multi-user auth wired up yet (see [Known limitations](#known-limitations-and-honest-status)) — every workflow currently writes against one lazily-created default workspace. `workflow_versions` stores an immutable JSON snapshot of the graph on every save (autosave history / future conflict resolution); `workflow_nodes`/`workflow_edges` are normalized for the *current* version only, which is what the execution engine actually reads. Migrations live in `apps/api/prisma/schema.prisma` — none have been run yet, because no Postgres instance exists (see [Deployment](#deployment)).

### Local-first architecture

```
Browser → IndexedDB (apps/web/src/lib/db.js) → local workflow draft
        ↘ (once a backend exists) → sync decision (push/pull/conflict/none)
                                     from three version numbers
                                     → server
```

Every save — including a brand-new workflow's very first autosave — is a real IndexedDB write, not a stub; the editor works fully offline, with a visible offline indicator. `packages/shared/src/sync.js` implements the push/pull/conflict decision algorithm, but nothing calls it yet: there's no server to sync *with* (see [Known limitations](#known-limitations-and-honest-status)). This is deliberately scoped as last-write-wins-with-warning once wired up, not CRDT-based real-time collaborative merging — true concurrent multi-user editing of the same graph is out of scope for this project.

### AI architecture

```
React frontend → Fastify backend → OpenRouter → backend → frontend
```

`OPENROUTER_API_KEY` is read once, server-side, in `apps/api/src/services/openRouterService.js` — it is never sent to the frontend and no frontend code references it. Without a key configured (the current state — see [Setup](#environment-variables)), both the AI node and AI workflow generation return clearly-labeled mocked output rather than silently pretending to call a model. With a key, workflow generation constrains the model to strict JSON using only the six node types, then schema-validates and repairs the response (unknown node types rejected, missing config fields backfilled with editor defaults, dangling edges dropped) before it ever reaches the frontend. The AI node's system prompt explicitly instructs the model to treat upstream workflow data as data, not instructions, as basic prompt-injection hardening. A generated workflow is never auto-executed: it loads into the same editor as any hand-built workflow, autosaves as a local draft, and needs the same explicit Run click and passing validation as everything else — review-before-execution is the existing architecture, not a bolt-on dialog.

## Setup

```bash
git clone https://github.com/fazal305/flowpilot.git
cd flowpilot
npm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
npm run dev:web   # http://localhost:5173
npm run dev:api   # http://localhost:4000 — works without a database (see below), execution/AI routes will 500 without one
```

The frontend works fully standalone (drafts, autosave, offline, the editor, local workflow list) with no backend running at all — only Run/AI-generation calls need the API, and those fail with a clear inline error rather than hanging if it's not reachable.

## Environment variables

**`apps/web/.env`** (copy from `.env.example`):
| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | No | Defaults to `http://localhost:4000` |

**`apps/api/.env`** (copy from `.env.example`):
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | For DB features | Postgres connection string (e.g. Supabase) |
| `JWT_SECRET` | For auth | Random 32+ char string |
| `WEB_ORIGIN` | For CORS | The frontend's origin |
| `OPENROUTER_API_KEY` | For real AI | Both AI features run mocked without it |
| `PORT` | No | Defaults to 4000 |
| `NODE_ENV` | No | Gates production-only behavior (secure cookies, stricter logging) |

Never commit `.env`. `.env.example` files contain safe placeholders only. `apps/api/.env.test` is the one exception — it holds a dummy `JWT_SECRET` used only by the test suite and is safe to commit.

## Development commands

```bash
npm run dev:web       # frontend dev server
npm run dev:api       # backend dev server (--watch)
npm run build:web     # production frontend build → apps/web/dist
npm run build:api     # prisma generate (no bundling needed for plain Node)
npm test              # all three workspaces' test suites
```

## Testing

87 tests (Node's built-in `node:test` — no framework dependency added) across all three workspaces, covering every unit of pure logic reachable without a live database: workflow graph validation and branching, the sync conflict algorithm, every condition operator, execution graph traversal, the retry/timeout wrapper (a mocked `fetch` proves a failing node actually retries with backoff, not just that the code compiles), the SSRF guard against every private IP range via literals (no real DNS, so the suite stays network-independent), password hashing, JWT round-trips, every zod validator, the AI-generated-graph validator, and the frontend's graph-shape adapter.

**Not covered, and why:** anything touching Prisma directly (the repositories, and by extension `executionEngine`'s actual database writes) has no automated tests, because there's no database to test against — mocking Prisma would test the mock, not the code.

## Deployment

**Frontend (Netlify):** a site exists at `flowpilot-fazal305.netlify.app`, linked via `netlify.toml` (`npm install && npm run build --workspace=apps/web`, publishing `apps/web/dist`, with a SPA catch-all redirect for React Router). The first production deploy attempt failed with the account's actual error, not a config problem: `"Account credit usage exceeded - new deploys are blocked until credits are added."` This needs the account owner to add credits/a payment method on Netlify — not something this process can or should do. Once resolved, redeploy with:
```bash
netlify deploy --prod --no-build --dir apps/web/dist
```
(run from `apps/web/`, after `npm run build --workspace=apps/web`, to route around a monorepo-detection crash in the current Netlify CLI version when other commands are run from the repo root).

**Backend (Fly.io) + Database (Supabase):** neither has been created — no accounts exist yet for either. Nothing backend-dependent (workflow persistence, execution, real AI calls) can go live until both exist. See the repeated callouts throughout this README and the git history for exactly what has and hasn't been verified as a result.

## Security notes

- Passwords are hashed with argon2id; sessions are JWTs in httpOnly cookies (`SameSite=None; Secure` in production, since frontend and backend are planned to live on different domains — `SameSite=Lax` would silently never send the cookie on a cross-site `fetch()`, a real bug caught and fixed during this pass).
- The HTTP Request node has an explicit SSRF guard: it resolves the target hostname and rejects RFC1918/loopback/link-local/cloud-metadata addresses (checked via DNS resolution, not just the literal hostname, to catch DNS-rebinding), and does not follow redirects (a classic SSRF bypass).
- All external input is zod-validated at the API boundary. Prisma parameterizes every query (no raw SQL anywhere in the codebase). No `dangerouslySetInnerHTML`, `eval`, or equivalent exists in the frontend.
- Global rate limiting (100/min) plus tighter limits on `/api/auth/*` (10/min, brute-force-sensitive) and workflow execution (20/min, since a run can trigger real side effects and, once a key exists, real AI spend).
- `OPENROUTER_API_KEY`, `DATABASE_URL`, and `JWT_SECRET` exist only in `apps/api/.env` (gitignored) and are never sent to or referenced by the frontend.
- **Known, unresolved gap:** the workflow/execution/AI routes currently require no authentication at all — only `GET /api/auth/me` is protected. This matches the current scope (single default workspace, no real login flow wired to the frontend), but it means **if the backend is ever deployed publicly with a real `OPENROUTER_API_KEY`, anyone who can reach the API can trigger AI calls that cost real money and read/modify any workflow.** Wiring real per-user auth onto these routes — or at minimum a shared-access gate — should happen *before* any public backend deployment with a live key, not after.
- One accepted, non-exploitable finding: `npm audit` flags a transitive `deepmerge-ts` vulnerability via `prisma`'s own CLI tooling (a devDependency). It's not reachable through any code this project runs — no user input ever reaches the Prisma CLI — and no fix is available upstream yet.

## Known limitations and honest status

This project was built with a deliberate practice: verify claims by actually running the code, not just reading it, and say clearly when something *hasn't* been verified rather than implying it has. The two most consequential open items:

1. **No live database.** No Supabase project exists. Every DB-touching code path (workflow persistence, the execution engine, real AI generation validation against stored data, real Prisma-backed repository logic) has been read carefully, unit-tested wherever the logic is pure enough to isolate, and proven to fail *gracefully* (clear errors, no crashes) when pointed at an unreachable database — but has never produced a correct result against real data. This is the single biggest gap in this project's verification story.
2. **No live backend deployment.** No Fly.io project exists, and the frontend's Netlify deploy is blocked on the account's credit limit (see [Deployment](#deployment)). The app has only ever been exercised via local dev servers.

Smaller, specific ones, in case they matter to a reader:
- Real multi-user authentication isn't wired to the frontend — the login form is UI-only, and the security gap above follows directly from that.
- Local-first sync is last-write-wins-with-warning, not CRDT-based collaborative merging.
- The realtime WebSocket hub is in-memory and single-process; it would need a shared channel (Redis pub/sub or Postgres `LISTEN`/`NOTIFY`) to work across more than one API instance.
- Phase 8's accessibility/responsive/performance pass fixed specific, verified gaps (mobile navigation, dialog focus management, a small-screen editor notice, node re-render memoization, loading-state flicker) rather than attempting an exhaustive audit — no formal contrast audit, no real screen-reader testing, no per-component reduced-motion sweep.
- No external public API was integrated beyond OpenRouter (which was a named requirement, not a discovery from the public-apis catalog) — the catalog was reviewed and nothing else was judged to genuinely improve the six-node MVP without adding scope for its own sake.

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Visual workflow editor
- [x] Phase 3 — Local-first (IndexedDB, offline, sync algorithm)
- [x] Phase 4 — Backend execution engine (code-complete, unverified against a live database)
- [x] Phase 5 — Execution inspector (built, wired to the real API, unverified end-to-end without a database)
- [x] Phase 6 — AI node + AI workflow generation (verified with a mocked model; real OpenRouter calls unverified)
- [x] Phase 7 — Realtime execution updates (WebSocket route verified live; broadcasts unverified without a database)
- [x] Phase 8 — Accessibility, responsive, performance (scoped pass, not an exhaustive audit)
- [x] Phase 9 — Tests (87 passing; nothing touching Prisma directly)
- [x] Phase 10 — Production hardening, deployment infrastructure, full documentation (this document) — actual live deployment blocked on Netlify credits and on Fly.io/Supabase accounts not existing

**Next, once unblocked:** create the Supabase project and run migrations against it; resolve the Netlify credit block and complete the frontend deploy; create a Fly.io project and deploy the backend (after closing the auth gap noted above); wire real authentication into the frontend; add a real `OPENROUTER_API_KEY` and verify the AI paths against the live API.

## License

Unlicensed — personal portfolio project.
