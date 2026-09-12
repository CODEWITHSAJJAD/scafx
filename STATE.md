# STATE — Live Project Log

**Read this file FIRST, before exploring the repo, before re-reading PRD/ARCHITECTURE in full, before grepping around to "see what's there."** This file is the single source of truth for what exists, what was decided, and what's next. If you ever find this file disagrees with the actual repo contents, trust the repo, fix this file immediately, and add a line under Known Issues noting the discrepancy and when you caught it.

Update this file **in the same commit** as the chunk work it describes — never as a separate later commit, never skipped "to save time."

---

## Current Status

- **Phase:** 0 — Prove the Engine
- **Last completed chunk:** C0.4
- **Next chunk to work on:** C0.5 (see `CHUNKS.md`)
- **Last updated:** 2026-09-12 by Antigravity

## Decisions Log

_Append-only, newest entry at top. One line each: date — decision — why — where it's binding (doc + section)._

- 2026-09-12 — Integrated `eta` with `{{` `}}` tags and automatic placeholder normalization in `generate()` — provides seamless compatibility with Mustache-style `{{var}}` placeholders and conditional template expressions without escaping code — ARCHITECTURE.md "Templating mechanism"
- 2026-09-12 — Defined TemplateManifest zod schema with compatibility arrays and placeholder declarations in `@project-scaffolder/core` — enforces template contract integrity and runtime version compatibility — ARCHITECTURE.md "Core data contracts"
- 2026-09-12 — Defined canonical Answer zod schema with scoped enums and exported inferred TypeScript types in `@project-scaffolder/core` — establishes single source of truth for generator input validation across CLI and future adapters — ARCHITECTURE.md "Core data contracts"
- 2026-09-12 — Scoped packages under `@project-scaffolder/*` using TypeScript NodeNext and shared `tsconfig.base.json` — establishes standard ESM package layout and strict typing across monorepo — ARCHITECTURE.md "Monorepo layout"

## Completed Chunks

| Chunk ID | Title | Commit | Date | Files created/touched |
|---|---|---|---|---|
| C0.4 | `core.generate()` skeleton | e3847a1 | 2026-09-12 | packages/core/src/generate.ts, packages/core/src/generate.test.ts, packages/core/src/types/file-op.ts, packages/core/src/ports/template-source.ts, packages/core/src/index.ts, packages/core/package.json, pnpm-lock.yaml |
| C0.3 | Template manifest schema | 554a549 | 2026-09-12 | packages/core/src/schema/manifest.ts, packages/core/src/schema/manifest.test.ts, packages/core/test/fixtures/valid-manifest.json, packages/core/test/fixtures/malformed-manifest.json, packages/core/src/index.ts |
| C0.2 | Answer-object schema | fd5fb98 | 2026-09-12 | packages/core/src/schema/answer.ts, packages/core/src/schema/answer.test.ts, packages/core/src/index.ts, packages/core/package.json, pnpm-lock.yaml |
| C0.1 | Repo skeleton | 089ffcd | 2026-09-12 | package.json, pnpm-workspace.yaml, tsconfig.base.json, packages/{core,cli,preflight,templates}, README.md, LICENSE, .gitignore, eslint.config.mjs, .prettierrc, .prettierignore, vitest.config.ts |

## File → Feature Map

_One row per meaningful file or folder, added as it's created. This is what lets a future session answer "which file covers X" without grepping the whole repo._

| Path | Feature / Responsibility | Added in chunk |
|---|---|---|
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

Full backlog lives in `CHUNKS.md`. Currently on Phase 0 — next is C0.5 (FileWriter adapter).

## Known Issues / Open Questions

_Carried over from `PRD.md`'s open questions until each is resolved; add new ones as they come up during implementation._

- Distribution: `npx` package vs. compiled binary — unresolved. Revisit after C0.9 per ARCHITECTURE.md's "Distribution" section. Matters more once the preflight auto-install tier (P1) is built, since `npx` can never self-install Node.
- Monorepo vs. polyrepo for the "Frontend+Backend separate" app shape — unresolved. Needed before C1.3.
- How opinionated should defaults be (e.g., is Postgres+Prisma a "just pick for me" default for Node)? — unresolved, affects onboarding UX; not blocking for Phase 0.
- Naming/branding (personal repo vs. under an existing brand) and license confirmation (MIT recommended) — resolved for C0.1 via standard MIT license.
