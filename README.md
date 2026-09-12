# Universal Project Scaffolder

> A modular, architecture- and database-aware universal project scaffolder CLI supporting Node, Python, .NET, React, and Flutter ecosystems.

---

## Features

- **Hexagonal / Ports-and-Adapters Architecture**: Core domain logic is completely decoupled from disk I/O, prompts, and CLI runtime.
- **Composition over Combinatorics**: Composes frontend + backend templates into unified full-stack monorepos with automatic CORS and API base URL cross-wiring without bespoke combinatorics.
- **Database & ORM Fragments**: Integrates database services (e.g. PostgreSQL 16 via Docker Compose) and ORMs (e.g. SQLAlchemy 2.0 with Alembic async migrations).
- **Environment Preflight (Guided-Manual Tier)**: Detects installed runtime environments (Node.js, Python), compares semver requirements, and provides actionable OS-specific install instructions with interactive bypass or `--force`/`--skip-preflight` flags.
- **Non-Interactive Equivalence**: Supports flag-based parameters and JSON configuration files (`--config scaffold.config.json`) producing byte-identical generated projects.
- **Automated Git Initialization**: Automatically runs `git init`, stages files, and creates the initial repository commit via `--git`.
- **Per-Project Custom README**: Automatically produces detailed, customized quick-start documentation and exact executable commands for every scaffolded project.

---

## P0 Golden Combinations

1. **Node.js + Express Standalone**: TypeScript, structured layered architecture (routes, controllers), health check endpoints, and Vitest test suite.
2. **Python + FastAPI Standalone**: Modern FastAPI with Pydantic v2, CORS middleware, modular API routers, and pytest test suite.
3. **React + Vite Standalone**: React 18+ with TypeScript, CSS modules, and production Vite build configuration.
4. **React + FastAPI Full-Stack Monorepo**: React+Vite frontend and FastAPI backend composed into a single repository with shared root configuration and environment cross-wiring.

---

## Monorepo Layout

```
packages/
  core/          # Pure domain logic & schema contracts (AnswerSchema, ManifestSchema, FileOp, generate, merge)
  cli/           # CLI shell adapter (oclif commands + @clack/prompts interactive UI)
  preflight/     # Runtime environment checkers (NodeChecker, PythonChecker) & preflight runner
  templates/     # Golden templates, reusable fragments, and filesystem loader adapter
```

---

## Installation & Development

### Prerequisites

- Node.js >= 20.x
- Python >= 3.10 (for Python/FastAPI smoke tests)
- pnpm >= 9.x

### Build & Test

```bash
# Install workspace dependencies
pnpm install

# Build all packages in topological order
pnpm -r build

# Run unit tests across all packages
pnpm run test:unit

# Run full golden template smoke tests (runs real npm/pip builds & dev servers)
pnpm run test:smoke

# Run full test suite
pnpm test

# Format and lint check
pnpm run format
pnpm run lint
```

---

## CLI Usage

### Interactive Mode

```bash
pnpm --filter @project-scaffolder/cli exec scaffold new
```

### Non-Interactive Flags

```bash
# Standalone Node+Express API with Postgres & Prisma
pnpm --filter @project-scaffolder/cli exec scaffold new \
  --name my-api \
  --stack node \
  --framework express \
  --shape standalone \
  --db postgres \
  --orm prisma \
  --git

# Full-Stack React + FastAPI Monorepo
pnpm --filter @project-scaffolder/cli exec scaffold new \
  --name my-fullstack-app \
  --shape fullstack \
  --frontend-stack react \
  --frontend-framework vite \
  --backend-stack python \
  --backend-framework fastapi \
  --db postgres \
  --orm sqlalchemy \
  --git
```

### Configuration File Mode

```bash
pnpm --filter @project-scaffolder/cli exec scaffold new --config scaffold.config.json
```

---

## License

MIT © Universal Project Scaffolder Team
