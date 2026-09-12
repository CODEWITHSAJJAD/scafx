# STATE — Live Project Log

**Read this file FIRST, before exploring the repo, before re-reading PRD/ARCHITECTURE in full, before grepping around to "see what's there."** This file is the single source of truth for what exists, what was decided, and what's next. If you ever find this file disagrees with the actual repo contents, trust the repo, fix this file immediately, and add a line under Known Issues noting the discrepancy and when you caught it.

Update this file **in the same commit** as the chunk work it describes — never as a separate later commit, never skipped "to save time."

---

## Current Status

- **Phase:** 1 — P0 Completion
- **Last completed chunk:** C1.4
- **Next chunk to work on:** C1.5 (see `CHUNKS.md`)
- **Last updated:** 2026-09-12 by Antigravity

## Decisions Log

_Append-only, newest entry at top. One line each: date — decision — why — where it's binding (doc + section)._

- 2026-09-12 — Composed React+Vite and FastAPI into full-stack golden combination via core composition mechanism — proves zero-bespoke-template full-stack monorepo generation — ARCHITECTURE.md "Composition, not combinatorics"
- 2026-09-12 — Implemented generalized fragment merge engine and full-stack template composition in core — enables combining frontend + backend golden templates into monorepo layout with wired CORS and API base URL without bespoke combinatorics — ARCHITECTURE.md "Composition, not combinatorics"
- 2026-09-12 — Added React+Vite standalone golden template with TypeScript, CSS modules/classes, and Vite build pipeline — establishes third P0 ecosystem reference template with JSX delimiter compatibility — ARCHITECTURE.md "packages/templates/"
- 2026-09-12 — Added Python+FastAPI standalone golden template with Pydantic v2, CORS middleware, and modular routes — establishes second P0 ecosystem reference template — ARCHITECTURE.md "packages/templates/"
- 2026-09-12 — Configured GitHub Actions multi-OS / multi-Node CI matrix running lint, format, build, unit tests, and live golden template smoke tests on every push/PR — prevents template rot and ensures cross-platform reliability — ARCHITECTURE.md "Testing strategy"
- 2026-09-12 — Added `--config` JSON input and non-interactive flag fallback resolution with verified byte-identical generator output — guarantees non-interactive equivalence for future headless adapters and automated workflows — ARCHITECTURE.md "CLI shell (packages/cli)"
- 2026-09-12 — Built `scaffold new` command in `@project-scaffolder/cli` using `oclif` and `@clack/prompts` with dynamic selection tree — wires interactive and flag inputs directly into `core.generate()` and `DiskFileWriter` — ARCHITECTURE.md "CLI shell (packages/cli)"
- 2026-09-12 — Built `node-express-standalone` as a runnable reference Express TypeScript project with health routes, and implemented `FsTemplateSource` loader in `@project-scaffolder/templates` — satisfies template runnable requirement and enables filesystem template resolution — ARCHITECTURE.md "packages/templates/"
- 2026-09-12 — Implemented `FileWriter` port with `DiskFileWriter` (using `fs-extra` and directory traversal guards) and `MemoryFileWriter` (in-memory test adapter) — cleanly separates generation domain logic from physical disk I/O — ARCHITECTURE.md "Architectural pattern: hexagonal / ports-and-adapters"
- 2026-09-12 — Integrated `eta` with `{{` `}}` tags and automatic placeholder normalization in `generate()` — provides seamless compatibility with Mustache-style `{{var}}` placeholders and conditional template expressions without escaping code — ARCHITECTURE.md "Templating mechanism"
- 2026-09-12 — Defined TemplateManifest zod schema with compatibility arrays and placeholder declarations in `@project-scaffolder/core` — enforces template contract integrity and runtime version compatibility — ARCHITECTURE.md "Core data contracts"
- 2026-09-12 — Defined canonical Answer zod schema with scoped enums and exported inferred TypeScript types in `@project-scaffolder/core` — establishes single source of truth for generator input validation across CLI and future adapters — ARCHITECTURE.md "Core data contracts"
- 2026-09-12 — Scoped packages under `@project-scaffolder/*` using TypeScript NodeNext and shared `tsconfig.base.json` — establishes standard ESM package layout and strict typing across monorepo — ARCHITECTURE.md "Monorepo layout"

## Completed Chunks

| Chunk ID | Title | Commit | Date | Files created/touched |
|---|---|---|---|---|
| C1.4 | React+Vite + FastAPI full-stack golden combination | 0cbcf64 | 2026-09-12 | packages/templates/src/react-fastapi.smoke.test.ts, packages/cli/src/commands/new.ts |
| C1.3 | App-shape composition logic in core | f958677 | 2026-09-12 | packages/core/src/merge.ts, packages/core/src/generate.ts, packages/core/src/schema/answer.ts, packages/core/src/merge.test.ts, packages/core/src/composition.test.ts, packages/templates/fragments/cors-api-wiring/*, packages/templates/src/loader.ts |
| C1.2 | React+Vite standalone golden template | 965decc | 2026-09-12 | packages/templates/react-vite-standalone/*, packages/templates/src/react-vite.smoke.test.ts |
| C1.1 | FastAPI standalone golden template | 230fd19 | 2026-09-12 | packages/templates/python-fastapi-standalone/*, packages/templates/src/python-fastapi.smoke.test.ts |
| C0.9 | CI workflow | c55e412 | 2026-09-12 | .github/workflows/ci.yml |
| C0.8 | Non-interactive mode | ea3ce78 | 2026-09-12 | packages/cli/src/commands/new.ts, packages/cli/src/commands/non-interactive.test.ts |
| C0.7 | CLI shell skeleton | fb87a3e | 2026-09-12 | packages/cli/bin/run.js, packages/cli/src/commands/new.ts, packages/cli/src/commands/new.test.ts, packages/cli/src/prompts/interactive.ts, packages/cli/src/index.ts, packages/cli/package.json, packages/templates/src/loader.ts, pnpm-lock.yaml |
| C0.6 | First golden template: Node+Express standalone | 9f28bb0 | 2026-09-12 | packages/templates/node-express-standalone/*, packages/templates/src/loader.ts, packages/templates/src/node-express.smoke.test.ts, packages/templates/src/index.ts, packages/templates/package.json, pnpm-lock.yaml |
| C0.5 | FileWriter adapter | 7532e94 | 2026-09-12 | packages/core/src/ports/file-writer.ts, packages/core/src/adapters/disk-file-writer.ts, packages/core/src/adapters/memory-file-writer.ts, packages/core/src/adapters/disk-file-writer.test.ts, packages/core/src/index.ts, packages/core/package.json, pnpm-lock.yaml |
| C0.4 | `core.generate()` skeleton | a424845 | 2026-09-12 | packages/core/src/generate.ts, packages/core/src/generate.test.ts, packages/core/src/types/file-op.ts, packages/core/src/ports/template-source.ts, packages/core/src/index.ts, packages/core/package.json, pnpm-lock.yaml |
| C0.3 | Template manifest schema | 554a549 | 2026-09-12 | packages/core/src/schema/manifest.ts, packages/core/src/schema/manifest.test.ts, packages/core/test/fixtures/valid-manifest.json, packages/core/test/fixtures/malformed-manifest.json, packages/core/src/index.ts |
| C0.2 | Answer-object schema | fd5fb98 | 2026-09-12 | packages/core/src/schema/answer.ts, packages/core/src/schema/answer.test.ts, packages/core/src/index.ts, packages/core/package.json, pnpm-lock.yaml |
| C0.1 | Repo skeleton | 089ffcd | 2026-09-12 | package.json, pnpm-workspace.yaml, tsconfig.base.json, packages/{core,cli,preflight,templates}, README.md, LICENSE, .gitignore, eslint.config.mjs, .prettierrc, .prettierignore, vitest.config.ts |

## File → Feature Map

_One row per meaningful file or folder, added as it's created. This is what lets a future session answer "which file covers X" without grepping the whole repo._

| Path | Feature / Responsibility | Added in chunk |
|---|---|---|
| `packages/templates/src/react-fastapi.smoke.test.ts` | Integration and bundle build smoke test for React+Vite + FastAPI full-stack composition | C1.4 |
| `packages/core/src/merge.ts` | Fragment merge engine for JSON deep merge, env variables, gitignore, and FileOps | C1.3 |
| `packages/core/src/merge.test.ts` | Unit tests for fragment merge utilities | C1.3 |
| `packages/core/src/composition.test.ts` | Unit tests for fullstack frontend + backend template composition logic | C1.3 |
| `packages/templates/fragments/cors-api-wiring/` | Reusable fragment for fullstack CORS & API URL configuration | C1.3 |
| `packages/templates/react-vite-standalone/` | Third golden template: runnable reference React+Vite SPA project | C1.2 |
| `packages/templates/react-vite-standalone/template.manifest.json` | Manifest declaring compatibility, placeholders, and fragments for React+Vite | C1.2 |
| `packages/templates/src/react-vite.smoke.test.ts` | Integration and bundle build smoke test for React+Vite template generation | C1.2 |
| `packages/templates/python-fastapi-standalone/` | Second golden template: runnable reference Python+FastAPI standalone project | C1.1 |
| `packages/templates/python-fastapi-standalone/template.manifest.json` | Manifest declaring compatibility, placeholders, and fragments for Python+FastAPI | C1.1 |
| `packages/templates/src/python-fastapi.smoke.test.ts` | Integration and syntax validation smoke test for FastAPI template generation | C1.1 |
| `.github/workflows/ci.yml` | GitHub Actions multi-OS / multi-Node CI pipeline | C0.9 |
| `packages/cli/src/commands/non-interactive.test.ts` | Non-interactive equivalence tests asserting byte-identical output between flags, config file, and core.generate() | C0.8 |
| `packages/cli/bin/run.js` | Executable CLI binary entrypoint | C0.7 |
| `packages/cli/src/commands/new.ts` | oclif `scaffold new` command orchestrating prompts, flags/config parsing, generation, and file writing | C0.7 |
| `packages/cli/src/commands/new.test.ts` | End-to-end integration tests for `scaffold new` command | C0.7 |
| `packages/cli/src/prompts/interactive.ts` | Interactive `@clack/prompts` selection flow matching PRD decision tree | C0.7 |
| `packages/templates/node-express-standalone/` | First golden template: runnable reference Node+Express standalone project | C0.6 |
| `packages/templates/node-express-standalone/template.manifest.json` | Manifest declaring compatibility, placeholders, and fragments for Node+Express | C0.6 |
| `packages/templates/src/loader.ts` | FsTemplateSource filesystem adapter implementing TemplateSource port | C0.6 |
| `packages/templates/src/node-express.smoke.test.ts` | Integration and smoke test executing generated project build and server health endpoints | C0.6 |
| `packages/core/src/ports/file-writer.ts` | FileWriter port interface | C0.5 |
| `packages/core/src/adapters/disk-file-writer.ts` | Real disk file writer adapter using fs-extra with path traversal protection | C0.5 |
| `packages/core/src/adapters/memory-file-writer.ts` | In-memory file writer adapter for virtual file operations and tests | C0.5 |
| `packages/core/src/adapters/disk-file-writer.test.ts` | Integration tests for DiskFileWriter and unit tests for MemoryFileWriter | C0.5 |
| `packages/core/src/generate.ts` | Pure generate() pipeline mapping Answer + TemplateSource to FileOp[] | C0.4 |
| `packages/core/src/generate.test.ts` | Unit tests for generator execution and placeholder substitution | C0.4 |
| `packages/core/src/types/file-op.ts` | FileOp interface data contract | C0.4 |
| `packages/core/src/ports/template-source.ts` | TemplateSource, Template, and TemplateFile port interfaces | C0.4 |
| `packages/core/src/schema/manifest.ts` | Template manifest zod schema and inferred TypeScript types | C0.3 |
| `packages/core/src/schema/manifest.test.ts` | Unit tests and fixture validation for TemplateManifestSchema | C0.3 |
| `packages/core/test/fixtures/valid-manifest.json` | Sample valid template manifest fixture for tests | C0.3 |
| `packages/core/test/fixtures/malformed-manifest.json` | Malformed manifest fixture for schema rejection tests | C0.3 |
| `packages/core/src/schema/answer.ts` | Answer object zod schema and inferred TypeScript types | C0.2 |
| `packages/core/src/schema/answer.test.ts` | Unit tests for AnswerSchema validation and edge cases | C0.2 |
| `package.json` | Root workspace package manifest and task orchestration scripts | C0.1 |
| `pnpm-workspace.yaml` | pnpm workspace definition and build script permissions | C0.1 |
| `tsconfig.base.json` | Shared TypeScript strict compiler configuration | C0.1 |
| `eslint.config.mjs` | ESLint 9 flat configuration for workspace linting | C0.1 |
| `.prettierrc` | Prettier code style and formatting rules | C0.1 |
| `.prettierignore` | Prettier ignore list protecting specs and build outputs | C0.1 |
| `.gitignore` | Monorepo git ignore patterns for build outputs and dependencies | C0.1 |
| `LICENSE` | MIT Open Source license | C0.1 |
| `README.md` | Monorepo layout overview and quickstart documentation | C0.1 |
| `vitest.config.ts` | Vitest test runner configuration | C0.1 |
| `packages/core/` | Domain logic: answer/manifest schemas and generator core | C0.1 |
| `packages/cli/` | CLI shell adapter using oclif and interactive prompts | C0.1 |
| `packages/preflight/` | Preflight checker interface and runtime version detectors | C0.1 |
| `packages/templates/` | Golden templates, manifests, and reusable fragments | C0.1 |

## Remaining Work

Full backlog lives in `CHUNKS.md`. On Phase 1 (P0 Completion) — next is C1.5 (Database/ORM fragment: Postgres + SQLAlchemy/Alembic).

## Known Issues / Open Questions

_Carried over from `PRD.md`'s open questions until each is resolved; add new ones as they come up during implementation._

- Distribution: `npx` package vs. compiled binary — unresolved. Revisit after C0.9 per ARCHITECTURE.md's "Distribution" section. Matters more once the preflight auto-install tier (P1) is built, since `npx` can never self-install Node.
- Monorepo vs. polyrepo for the "Frontend+Backend separate" app shape — unresolved. Needed before C1.3.
- How opinionated should defaults be (e.g., is Postgres+Prisma a "just pick for me" default for Node)? — unresolved, affects onboarding UX; not blocking for Phase 0.
- Naming/branding (personal repo vs. under an existing brand) and license confirmation (MIT recommended) — resolved for C0.1 via standard MIT license.
