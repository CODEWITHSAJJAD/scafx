# CHUNKS — Execution Backlog

Read after `PRD.md` and `ARCHITECTURE.md`. This is the ordered, small-unit work backlog. **Work exactly one chunk per session unless explicitly told otherwise.** Each chunk must be independently committable and leave the repo in a working state (tests passing).

Status values: `todo`, `in_progress`, `done`. The live status for each chunk lives in `STATE.md`, not here — this file is the plan; `STATE.md` is the log of what actually happened. Do not mark status in this file.

---

## Phase 0 — Prove the Engine

**Goal:** one real end-to-end path (Node+Express standalone) working through the whole pipeline, before adding breadth. De-risks the architecture in `ARCHITECTURE.md` before 20 templates are written against it.

- **C0.1 — Repo skeleton.** pnpm workspace init; root `package.json`, `tsconfig.base.json`; folders `packages/{core,cli,preflight,templates}`; `README.md` stub; `LICENSE` (MIT); `.gitignore`; ESLint + Prettier config. *Acceptance:* `pnpm install` succeeds; `pnpm -r build` runs without error on empty stub packages; first commit made.
- **C0.2 — Answer-object schema.** `packages/core/src/schema/answer.ts` — zod schema per ARCHITECTURE.md's "Core data contracts." *Acceptance:* unit test validates a sample valid object and rejects an invalid one with a clear error message.
- **C0.3 — Template manifest schema.** `packages/core/src/schema/manifest.ts` — zod schema per ARCHITECTURE.md. *Acceptance:* unit test loads a fixture manifest JSON and validates it; a malformed fixture is rejected.
- **C0.4 — `core.generate()` skeleton.** Pure function: `(answer, templateSource) -> FileOp[]`. No disk I/O. *Acceptance:* unit test with an in-memory fixture template asserts the correct file list and correctly substituted placeholder content.
- **C0.5 — FileWriter adapter.** `fs-extra`-based adapter that takes `FileOp[]` and writes to real disk; kept fully separate from `core`. *Acceptance:* integration test generates into a temp dir and asserts real file contents on disk.
- **C0.6 — First golden template: Node+Express standalone.** `packages/templates/node-express-standalone/` — a real runnable Express project + `template.manifest.json`. *Acceptance:* `core.generate()` + `FileWriter` output, then `npm install && npm start` in the generated project actually runs (smoke test script, not just "files exist").
- **C0.7 — CLI shell skeleton.** oclif `scaffold new` command, `@clack/prompts` for stack/framework selection only (Node+Express path only for now), wired to `core.generate()` + `FileWriter`. *Acceptance:* running the CLI interactively produces a working Express project end to end.
- **C0.8 — Non-interactive mode.** Flags/`--config` path producing the identical answer object as the interactive path. *Acceptance:* test asserts `scaffold new --stack node --framework express --name demo` produces byte-identical output to the interactive equivalent.
- **C0.9 — CI workflow.** GitHub Actions: run unit tests + the C0.6 smoke test on every push. *Acceptance:* workflow passes on a clean checkout.

## Phase 1 — P0 Completion

**Goal:** all four P0 golden combinations working, full-stack composition proven, preflight (guided-manual tier) shipped.

- **C1.1 — FastAPI standalone golden template.**
- **C1.2 — React+Vite standalone golden template.**
- **C1.3 — App-shape composition logic in core.** Extend `core.generate()` to combine a frontend + backend template for the "full-stack, same repo" shape (CORS + API-base-URL env wiring as a fragment). This is the first real test of the "composition, not combinatorics" rule in ARCHITECTURE.md — do not special-case this pairing; implement the general fragment-merge mechanism.
- **C1.4 — React+Vite + FastAPI full-stack golden combination**, built using C1.3's mechanism (not a bespoke template).
- **C1.5 — Database/ORM fragment: Postgres + SQLAlchemy/Alembic**, composed onto the FastAPI base template via the fragment mechanism.
- **C1.6 — Per-project README generation.** Lists what was scaffolded + the next 3 commands.
- **C1.7 — Post-generate `git init` + first commit step.**
- **C1.8 — Preflight package (guided-manual tier only).** `Checker` interface + Node and Python checkers (the two runtimes needed for the four P0 combos) using `execa`; wired into `scaffold new` before generation; prints instructions and offers "continue anyway" or "stop" — no auto-install yet. *Acceptance:* test with an injected fake checker reporting a too-old version produces the correct guidance and halts unless "continue anyway" is chosen.
- **C1.9 — Extend CI matrix** to cover all four P0 combinations.
- **C1.10 — Publish v0.1.0.** npm publish, git tag, `CHANGELOG.md` entry.

## Phase 2 — Breadth

**Goal:** cover remaining P1 ecosystems, frameworks, database/ORM fragments, extras, and preflight checkers.

- **C2.1 — Fastify standalone golden template.** `packages/templates/node-fastify-standalone/` with TypeScript, layered routes/plugins, health check, and smoke test.
- **C2.2 — NestJS standalone golden template.** `packages/templates/node-nestjs-standalone/` with TypeScript decorators, modular architecture, health controller, and smoke test.
- **C2.3 — Flask standalone golden template.** `packages/templates/python-flask-standalone/` with application factory, blueprints, config, and pytest smoke test.
- **C2.4 — Django standalone golden template.** `packages/templates/python-django-standalone/` with settings, ASGI/WSGI, app structure, and smoke test.
- **C2.5 — Next.js standalone golden template.** `packages/templates/react-nextjs-standalone/` with App Router, TypeScript, Tailwind/CSS modules, and build smoke test.
- **C2.6 — .NET Web API standalone golden template & .NET preflight checker.** `packages/templates/dotnet-webapi-standalone/` with C# 12 / .NET 8 minimal API + `DotnetChecker` in `@project-scaffolder/preflight`.
- **C2.7 — Flutter standard golden template & Flutter preflight checker.** `packages/templates/flutter-standard/` with feature-first folder architecture + `FlutterChecker` in `@project-scaffolder/preflight`.
- **C2.8 — Prisma ORM fragment for Node.js.** `packages/templates/fragments/node-prisma/` with schema, client initialization, migration scripts, and Postgres/MySQL/SQLite compatibility.
- **C2.9 — MongoDB database fragments.** `packages/templates/fragments/mongo-mongoose/` (Node) and `packages/templates/fragments/mongo-motor/` (Python) + Docker Compose services.
- **C2.10 — Docker & CI workflow generator extras.** Fragments generating user project `Dockerfile`, root `docker-compose.yml`, and `.github/workflows/ci.yml`.
- **C2.11 — JWT Authentication boilerplate fragment.** Composable JWT authentication middleware and login/register endpoints for Node and Python backends.
- **C2.12 — Publish v0.2.0.** Documentation update, CHANGELOG entry, and release tagging for Phase 2.


## Phase 3 — Microservices Mode

Gateway + N-service generation modeled on the LedgerPOS reference architecture (see the research doc, section on architecture-at-a-glance). Plan in detail once Phase 2's fragment system has a few real database/ORM fragments proven out, since microservices mode is itself a large fragment/composition exercise.

## Phase 4 — Community & Optional Web UI

Contribution + template-authoring docs, then the P2 web UI as a thin adapter over the stable `core` package. Do not start this phase's chunks until Phase 1 has shipped and been used on at least one real project (PRD success metric).

---

## Rules for working this backlog (see also `AGENTS.md`)

- Respect ordering and implicit dependencies (a chunk that says "composed via C1.3's mechanism" cannot start before C1.3 is `done` in STATE.md).
- If a chunk's acceptance criteria can't be met as written because the spec was ambiguous, make the most reasonable call, log it as a Decision in STATE.md, and continue — don't silently guess without a record, and don't stall waiting for a human unless the ambiguity is genuinely blocking.
- If implementing a chunk reveals that a later chunk's plan no longer makes sense, edit *this file* to reflect the new plan and note why in STATE.md's Decisions Log — don't just improvise later chunks unrecorded.
