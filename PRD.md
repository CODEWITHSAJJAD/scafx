# PRD — Universal Project Scaffolder

Read this file to understand **what** we're building and **why**. For **how** to build it, see `ARCHITECTURE.md`. For the actual work breakdown, see `CHUNKS.md`. Do not start coding from this file alone.

## Problem

Every new project (client work, personal builds) repeats the same 1-3 hours of throwaway setup: framework choice, database + migrations, folder structure, env config, Docker. This cost repeats per stack. Existing generators solve this per-framework (`create-react-app`, `flutter create`, Spring Initializr) — nothing gives one consistent CLI across Node, Python, .NET, React, and Flutter with architecture- and database-aware output, with no custom DSL to learn.

The closest existing tool is **JHipster** (Java/Spring-rooted, uses its own JDL entity-modeling language, never touches Python or Flutter). That gap — this exact stack combination, zero-DSL simplicity, plus an environment preflight/auto-install layer — is what this project fills. Full competitive research lives in the companion `project-scaffolder-prd.md` research doc (section 12) if needed, but is not required reading to start building.

## Goals

1. Cut project-setup time from ~1-3 hours to under 5 minutes for covered stack/architecture/database combinations.
2. Cover 5 ecosystems: Node, Python (FastAPI/Flask/Django), .NET, React, Flutter — standalone and combinable full-stack pairs.
3. Make architecture (monolith / modular monolith / microservices / separate frontend+backend / full-stack single repo) a composable choice, not baked into each template.
4. Let contributors add new stacks/frameworks without touching core code.
5. It gets used to bootstrap real client and personal projects, not just demoed.

## Non-Goals (v1)

- No hosted SaaS at launch — local-first open-source CLI. Web UI is a later phase (P2).
- Not a low-code app builder — scaffolds structure, not business logic.
- Not exhaustive framework coverage on day one (Rust/Java/Go/Vue/Svelte/Angular are future considerations).
- No auto-deployment to cloud infrastructure.
- Not a general-purpose OS package manager — installs dev-language runtimes only, via well-known version managers; database *servers* are provisioned via Docker, not installed on the host.

## Target Users

Solo developers/freelancers working across stacks; small agencies standardizing project starts; learners wanting a "correct" reference structure per stack; OSS contributors adding their own templates.

## The Selection Flow (spec — implement exactly this shape)

```
1. Project name
2. Stack:             Node · Python · .NET · React · Flutter
3. Framework:          (conditional on stack)
4. App shape:          Standalone | Frontend+Backend (separate) | Full-stack (same repo) | Microservices
5. Architecture style:  (conditional on shape)
6. Database:           (conditional on stack/framework) | None
7. ORM / migrations:   (auto-suggested default from DB choice, override allowed)
8. Extras (multi-select): auth boilerplate, Docker/Compose, CI workflow, lint/format config, testing setup, .env template, git init
9. Environment preflight check (see below) → confirm → generate
```

### Stack → Framework (v1 scope)
| Stack | Frameworks |
|---|---|
| Node | Express, Fastify, NestJS |
| Python | FastAPI, Flask, Django |
| .NET | ASP.NET Core Web API, ASP.NET Core MVC |
| React | Vite SPA, Next.js |
| Flutter | No sub-framework; architecture choice = state management (Provider/Riverpod) + feature-first folders |

### App shape → Architecture
| Shape | Options |
|---|---|
| Standalone | Simple layered, or Clean/Hexagonal |
| Frontend+Backend (separate) | Two folders/repos wired by API base URL + CORS |
| Full-stack (same repo) | Monorepo `/frontend` + `/backend`, shared `.env`, one `docker-compose.yml` |
| Microservices | Gateway + N named services, shared message queue option (RabbitMQ), database-per-service, one root `docker-compose.yml` |

### Database → ORM/migration defaults
| Database | Node | Python | .NET | Flutter |
|---|---|---|---|---|
| PostgreSQL | Prisma + Prisma Migrate | SQLAlchemy 2.0 + Alembic, or Flyway | EF Core, or Flyway | (Supabase client) |
| MySQL | Prisma | SQLAlchemy + Alembic | EF Core | (Supabase/other) |
| MongoDB | Mongoose | Motor/PyMongo | MongoDB.Driver | — |
| SQLite | Prisma | SQLAlchemy + Alembic | EF Core | Drift |
| None | — | — | — | Drift (local-only) |

## Environment Preflight (feature, not optional)

Before writing files, detect installed runtime versions against the selected combination's requirements. Two tiers:
1. **Guided manual install (default, P0):** report pass/fail, print exact install command + doc link, stop. No system changes.
2. **Opt-in auto-install (P1, off by default):** with explicit per-run confirmation, install via known version managers (nvm/fnm, pyenv, winget/brew/apt) — never a custom install script. Always print the command before running it.

Database servers default to Docker Compose generation instead of a host-installed check.

**Known constraint:** an `npx`-distributed CLI needs Node to launch, so it can never offer to "install Node for you." Revisit distribution (compiled binary vs. npx) once this feature matures — do not silently design around this without flagging it in STATE.md.

## Requirements (MoSCoW)

### P0 — Must-Have
- Interactive prompt flow implementing the full selection tree above, for all 5 stacks.
- Template-manifest system: each template is a folder + manifest declaring stack/framework/compatible shapes+databases/min runtime version — never hardcoded into the CLI binary.
- Working "golden" templates for at minimum: Node+Express standalone, Python+FastAPI standalone, React+Vite standalone, and the React+FastAPI full-stack pairing.
- Consistent variable substitution (project name, package name/namespace, DB credential placeholders).
- Non-interactive mode: all answers passable as flags or a config file — this is also what a future web UI calls under the hood.
- Auto-generated README per generated project explaining what was scaffolded + next commands.
- Correct `.gitignore` per stack; optional `git init` + first commit.
- CI pipeline in this tool's own repo that generates + builds one project per supported combination (template-rot guard).
- Environment preflight check (guided-manual tier only for v1).

### P1 — Nice-to-Have
- Remaining framework coverage: Flask, Django, NestJS, Fastify, ASP.NET MVC, Next.js, Flutter.
- Microservices mode (gateway + N services + docker-compose + RabbitMQ option).
- Auth boilerplate toggle (JWT bearer) per backend framework.
- Docker/docker-compose generation for every combination.
- GitHub Actions CI template generation for the *user's* new project.
- Linting/formatting presets per stack.
- Contribution + template-authoring docs.
- Config save/replay (re-run last answers with a new project name).
- Opt-in auto-install tier of the preflight feature.
- `--docker-db` flow generating a DB container wired to `.env`.

### P2 — Future
- Web UI over the same generator core.
- Template marketplace/registry.
- Additional ecosystems (Go, Rust, Java/Spring, Vue, Svelte).
- Cloud deploy target generation.
- VS Code extension.
- Copier-style "re-apply template updates to an already-generated project."

## Success Metrics
- Time-to-first-generated-project under 5 minutes including CLI install.
- All P0 "golden" combinations generate and run with zero manual fixes (CI-verified).
- GitHub stars / npm downloads / community template contributions over time (adoption signal, not a launch gate).
