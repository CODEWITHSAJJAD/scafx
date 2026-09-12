# ARCHITECTURE — Universal Project Scaffolder

Read after `PRD.md`. This file is the binding technical contract. If an implementation decision in `CHUNKS.md` or during coding conflicts with this file, **this file wins** — propose a change here explicitly (as its own chunk) rather than drifting away from it silently.

## Is this tool itself microservices? No.

The scaffolder is a **single local CLI application** — a modular monolith. Microservices is an *output option it generates for users* (an app-shape choice), not how the tool is built. One user per invocation, no independent scaling need — building the tool as networked services would add distributed-systems cost for zero benefit.

## Architectural pattern: hexagonal / ports-and-adapters

`core` defines ports (interfaces). Everything else is an adapter plugged into those ports:
- `Checker` port → adapters: node-checker, python-checker, dotnet-checker, flutter-checker (preflight package)
- `TemplateSource` port → adapter: filesystem-based template loader (templates package)
- `FileWriter` port → adapter: real disk writer (fs-extra) for production, in-memory (`memfs`) for tests
- Front-end port → adapters: CLI (oclif + @clack/prompts) now, Web UI (P2) later — both call the same `core.generate()`

**Rule: `core` must never import from `cli`, `preflight`, or any adapter package.** Dependencies point inward only.

## Monorepo layout

```
packages/
  core/          # pure domain logic — no prompts, no console output, no process.exit.
                 # Exports: answer schema (zod), manifest schema (zod), generate(answer, templateSource) -> FileOp[]
  cli/           # oclif commands + @clack/prompts. Builds the answer object, calls core, calls FileWriter.
                 # Also owns non-interactive flag/config-file parsing (must produce an identical answer object).
  preflight/     # Checker interface + per-runtime implementations. Owns version detection AND
                 # (P1, later) the opt-in installer strategies. core never knows *how* a version was checked.
  templates/     # golden template projects, each a real runnable project + template.manifest.json.
apps/
  web/           # P2, future — thin adapter calling packages/core. Do not create until P2.
```

Tooling: pnpm workspaces (+ Turborepo optional for task caching). TypeScript strict mode everywhere. `vitest` for unit tests.

## Core data contracts

### Answer object (zod schema in `packages/core/src/schema/answer.ts`)
Fields: `projectName`, `stack`, `framework`, `appShape`, `architecture`, `database`, `orm`, `extras[]`, `runtimeVersion?`. Validate with zod; export the inferred TS type from the same schema so there is one source of truth.

### Template manifest (zod schema in `packages/core/src/schema/manifest.ts`)
Fields: `id`, `stack`, `framework`, `compatibleShapes[]`, `compatibleDatabases[]`, `minRuntimeVersion`, `placeholders[]` (declares which tokens like `{{projectName}}` appear and in which files), `fragments[]` (optional composable pieces this template can accept — e.g. `docker`, `auth-jwt`, `orm-prisma`).

### FileOp
`{ path: string, content: string }` — the *planned* output of `core.generate()`. Writing to disk is a separate adapter step (`FileWriter`), never done inside `core`, so `generate()` stays unit-testable against an in-memory fixture with no disk I/O.

## Composition, not combinatorics

Do not create one static template per (stack × framework × shape × database) combination — that's hundreds of templates for a small contributor base to maintain. Instead: one base template per framework, plus independent **fragments** (Docker, a given ORM, auth) that `core` merges onto the base according to the answer object and the template's declared `fragments[]` compatibility. This is the single most important structural decision in this codebase — do not deviate from it to "get a chunk done faster."

## Templating mechanism

`eta` (preferred) or `mustache` for placeholder substitution. Choose delimiters per file type so they never collide with the target language's own syntax (JSX braces, Razor `@`, Dart string interpolation) — verify this explicitly when adding the first template per stack, and record the chosen delimiter convention in STATE.md's Decisions Log.

## Environment preflight (`packages/preflight`)

`Checker` interface: `{ name: string, detect(): Promise<{found: boolean, version?: string}>, minVersionRequired: string, manualInstallInstructions(os: OS): string }`. One implementation per runtime (node, python, dotnet, flutter — dart), using `execa` to run `<tool> --version` and a semver comparison. v1 (P0) only implements the guided-manual tier: report + print instructions + stop, gated by an explicit answer/flag before generation proceeds. The opt-in auto-install tier (P1) adds an `install(os): Promise<void>` method per checker that shells out to a known version manager (nvm/fnm, pyenv, winget/brew/apt) and must print the exact command before running it — never implement a custom install script.

Database servers: default path generates a `docker-compose.yml` service instead of checking for a host install (see PRD "Environment Preflight").

## CLI shell (`packages/cli`)

`oclif` — chosen specifically for its plugin model, since P1/P2 community-contributed stacks should be addable as oclif plugins without touching core. Commands: `scaffold new` (the main flow), `scaffold list-templates`, `scaffold doctor` (standalone preflight check with no generation). Interactive path (`@clack/prompts`) and non-interactive path (flags or `--config <file>`) must both terminate in the exact same validated answer object passed to `core.generate()` — write a test that asserts this equivalence for at least one combination before considering the CLI shell "done."

## Testing strategy

- Unit tests (`vitest`) for `core`: given a fixture answer object + fixture template (in fixtures/, not a real golden template), assert the exact FileOp list and substituted content. No disk I/O.
- Integration test per golden template: run `core.generate()` for real, write via the real `FileWriter` to a temp dir, then actually run that project's install/build/start command as a smoke test.
- CI matrix (GitHub Actions): one job per P0 golden combination running its integration/smoke test on every push. This is a P0 requirement, not optional — a scaffolder that generates broken projects is worse than no tool.

## Design patterns in use (for reference while implementing)

- **Strategy** — interchangeable, same-interface pieces: ORM/migration choices, per-OS install commands, per-version-manager installers.
- **Adapter** — OS-specific installer commands; CLI vs. future Web front-ends onto the same core.
- **Composite/merge** — stacking fragments onto a base template (see "Composition, not combinatorics" above).
- **Command** — CLI verbs as oclif command classes (comes largely for free from the framework).

## Distribution

v1: npm package, `npx <name>`. Revisit a compiled binary (`bun build --compile` / `deno compile`) once the preflight feature matures, specifically because of the Node-bootstrap constraint noted in PRD.md — do not decide this permanently inside a chunk; it's a standing open question tracked in STATE.md.
