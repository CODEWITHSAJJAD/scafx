# AGENTS — How To Work On This Repo

This file governs *how* you work, every session, regardless of which chunk you're on. `PRD.md` says what to build, `ARCHITECTURE.md` says how it must be built, `CHUNKS.md` is the backlog, `STATE.md` is the live log. Read all four before writing any code, in that order, every session — but see the rule below about *not* re-exploring beyond that.

If your tooling looks for `CLAUDE.md` specifically, make that file a one-line pointer to this one rather than duplicating content, so there is one instruction set, not two that can drift apart.

## The core discipline: state over exploration

`STATE.md`'s File → Feature Map and Completed Chunks table exist so you never need to re-derive "what's already here" from scratch. Before grepping the whole repo or re-reading every file to orient yourself, check `STATE.md` first — it should already answer "does X exist" and "which file handles Y." Only fall back to broader exploration when `STATE.md` is silent on the specific question, or when you've caught it disagreeing with reality (in which case fix it immediately, per its own instructions, before continuing).

## One chunk at a time

- Work exactly one chunk from `CHUNKS.md` per session unless the human explicitly asks for more.
- Confirm the chunk's dependencies (anything it says it's "built on" or "composed via") are marked `done` in `STATE.md` before starting. If not, stop and say so rather than working out of order.
- Before writing code, re-read the specific `ARCHITECTURE.md` sections relevant to this chunk (e.g., don't re-derive the manifest schema from memory when implementing C0.3 — go re-read the "Core data contracts" section).

## Definition of done for a chunk

1. Acceptance criteria from `CHUNKS.md` are met and verified (tests written and passing, not just "looks right").
2. Code respects the ports-and-adapters boundaries in `ARCHITECTURE.md` (e.g., `core` never imports from `cli` or `preflight`).
3. Commit with message format: `chunk(<ID>): <short title>` — e.g. `chunk(C0.6): Node+Express standalone golden template`.
4. In the **same commit**: update `STATE.md` —
   - Move the chunk into the Completed Chunks table (commit hash, date).
   - Add/update rows in the File → Feature Map for any new meaningful file or folder.
   - Append any non-trivial decision made while implementing to the Decisions Log (e.g., "chose `eta` over `mustache` because X collided with JSX braces").
   - Update "Next chunk to work on."
5. Do not start the next chunk in the same session unless explicitly told to. Stop and report: what you built, test results, commit hash, what's next.

## Handling ambiguity

If a chunk's spec is ambiguous or its acceptance criteria can't be met exactly as written:
- Make the most reasonable call consistent with `ARCHITECTURE.md`.
- Log it as a Decision in `STATE.md`, not just in the commit message.
- Only stop and ask the human if the ambiguity is genuinely blocking (would need to be undone/reworked based on their answer) — otherwise keep moving, per the project's general "don't guess silently, but don't stall on every small call either" approach.

## Scope discipline

- Don't touch files outside the current chunk's declared scope without noting why in the Decisions Log.
- Don't "while I'm in here" refactor unrelated code — file it as a note in `STATE.md`'s Known Issues instead, or propose it as a new chunk in `CHUNKS.md`.
- Treat `PRD.md` and `ARCHITECTURE.md` as read-only during normal chunk work. If a chunk reveals they need to change, that's its own explicit edit (and worth a Decisions Log entry explaining why), not a silent drift.

## Coding conventions

- TypeScript strict mode across all packages.
- pnpm workspaces; do not introduce a second package manager.
- `vitest` for unit tests; integration/smoke tests per `ARCHITECTURE.md`'s testing strategy.
- One package per concern per the monorepo layout in `ARCHITECTURE.md` — do not add new top-level packages without updating that file first.
- Every template added under `packages/templates/` must be a real, runnable project (per `ARCHITECTURE.md`), not a folder of template fragments with no working reference form.

## Reporting back

At the end of every session, report in this shape: chunk worked on → what was built → test/acceptance results → commit hash and message → what `STATE.md` now says is next. Keep it short; `STATE.md` is the durable record, the chat report is just a pointer to it.
