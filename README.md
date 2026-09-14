# Universal Project Scaffolder

> A modular, architecture- and database-aware universal project scaffolder CLI supporting Node.js, Python, .NET, React, and Flutter ecosystems.

---

## Features

- **Hexagonal / Ports-and-Adapters Architecture**: Core domain logic is completely decoupled from disk I/O, prompts, and CLI runtime.
- **Composition over Combinatorics**: Composes frontend + backend templates into unified full-stack monorepos, and multi-service templates into distributed microservice topologies without bespoke combinatorics.
- **Microservices Orchestration**: Scaffolds full microservice meshes featuring an Express API Gateway with dynamic reverse proxy routing (`http-proxy-middleware`), correlation IDs (`x-request-id`), aggregated healthchecks, inter-service authentication discovery (`AUTH_SERVICE_URL`), dedicated database instances, and bridge network orchestration (`microservices-net`).
- **Rich Database & ORM Fragments**: Integrates database services (PostgreSQL, MongoDB, MySQL, SQLite via Docker Compose) and ORMs (Prisma, SQLAlchemy 2.0/Alembic, Mongoose, Motor).
- **Environment Preflight (Guided-Manual Tier)**: Detects installed runtime environments (Node.js, Python, .NET SDK, Flutter SDK), compares semver requirements, and provides actionable OS-specific install instructions with interactive bypass or `--force`/`--skip-preflight` flags.
- **Production-Ready Extras**: Multi-stage Dockerfiles, root `docker-compose.yml`, GitHub Actions CI workflows, and JWT authentication boilerplate (`/register`, `/login`, `/me`).
- **Non-Interactive Equivalence**: Supports flag-based parameters and JSON configuration files (`--config scaffold.config.json`) producing byte-identical generated projects.
- **Automated Git Initialization**: Automatically runs `git init`, stages files, and creates the initial repository commit via `--git`.
- **Per-Project Custom README**: Automatically produces detailed, customized quick-start documentation and exact executable commands for every scaffolded project.

---

## Supported Ecosystems & Frameworks

| Ecosystem   | Frameworks                          | Database Options                   | ORMs / ODMs                 | Extras                         |
| ----------- | ----------------------------------- | ---------------------------------- | --------------------------- | ------------------------------ |
| **Node.js** | Express, Fastify, NestJS            | PostgreSQL, MySQL, SQLite, MongoDB | Prisma, Mongoose            | Docker, CI, JWT Auth, Git, Env |
| **Python**  | FastAPI, Flask, Django              | PostgreSQL, MongoDB, SQLite        | SQLAlchemy / Alembic, Motor | Docker, CI, JWT Auth, Git, Env |
| **.NET**    | ASP.NET Core Web API (Minimal API)  | PostgreSQL, SQLite                 | Entity Framework Core       | Docker, CI, Git, Env           |
| **React**   | Vite (SPA), Next.js 15 (App Router) | None (Full-Stack Composable)       | None                        | Docker, CI, Git, Env           |
| **Flutter** | Flutter Standard (Material 3)       | SQLite / Local                     | Drift / Local               | CI, Git, Env                   |

---

## Golden Templates & Combinations

1. **Node.js + Express Standalone**: TypeScript, structured layered architecture (routes, controllers), health check endpoints, and Vitest test suite.
2. **Node.js + Fastify Standalone**: High-performance TypeScript API with `@fastify/cors`, modular plugins, and health routes.
3. **Node.js + NestJS Standalone**: Enterprise-tier modular architecture with TypeScript decorators, controllers, and services.
4. **Python + FastAPI Standalone**: Modern FastAPI with Pydantic v2, CORS middleware, modular API routers, and pytest test suite.
5. **Python + Flask Standalone**: Application factory pattern (`create_app`), modular Blueprints, and CORS support.
6. **Python + Django Standalone**: Batteries-included web framework with modular settings, ASGI/WSGI entrypoints, and JSON API routes.
7. **React + Vite Standalone**: React 18+ with TypeScript, CSS modules, and production Vite build configuration.
8. **React + Next.js 15 Standalone**: Next.js App Router with TypeScript, API route handlers, and Tailwind CSS.
9. **.NET 8 Web API Standalone**: C# 12 minimal API, OpenAPI/Swagger documentation, and health check endpoints.
10. **Flutter Standard Standalone**: Feature-first domain architecture with Material 3 design and widget test suites.
11. **React + FastAPI Full-Stack Monorepo**: React+Vite frontend and FastAPI backend composed into a single repository with shared root configuration and environment cross-wiring.
12. **Express API Gateway**: Reverse proxy router with `x-request-id` tracing, path routing (`/api/<service>/*`), and aggregated healthchecks.
13. **Microservices Monorepo**: Gateway + multi-service topology (Auth Service, Catalog Service, Domain Services) with unified Docker Compose bridge network and dedicated databases.

---

## Monorepo Layout

```
packages/
  core/          # Pure domain logic & schema contracts (AnswerSchema, ManifestSchema, FileOp, generate, merge, docker, ci, readme)
  cli/           # CLI shell adapter (oclif commands + @clack/prompts interactive UI)
  preflight/     # Runtime environment checkers (NodeChecker, PythonChecker, DotnetChecker, FlutterChecker) & preflight runner
  templates/     # Golden templates, reusable fragments, and filesystem loader adapter
```

---

## Installation & Development

### Prerequisites

- Node.js >= 20.x
- Python >= 3.10
- .NET SDK >= 8.0 (optional, for .NET templates)
- Flutter SDK >= 3.x (optional, for Flutter templates)
- pnpm >= 9.x

### Build & Test

```bash
# Install workspace dependencies
pnpm install

# Build all packages in topological order
pnpm -r build

# Run unit tests across all packages
pnpm run test:unit

# Run full golden template smoke tests (runs real npm/pip/dotnet/flutter builds)
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
# Standalone Node+Fastify API with Postgres & Prisma + JWT Auth + Docker
pnpm --filter @project-scaffolder/cli exec scaffold new \
  --name my-fastify-api \
  --stack node \
  --framework fastify \
  --shape standalone \
  --db postgres \
  --orm prisma \
  --extras auth,docker,ci,git

# Standalone Python+FastAPI with MongoDB & Motor + JWT Auth
pnpm --filter @project-scaffolder/cli exec scaffold new \
  --name my-mongo-api \
  --stack python \
  --framework fastapi \
  --shape standalone \
  --db mongodb \
  --orm motor \
  --extras auth,docker,ci,git

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
  --extras auth,docker,ci,git

# Microservices Mode (Express Gateway + Node Auth Service + Python FastAPI Catalog)
pnpm --filter @project-scaffolder/cli exec scaffold new \
  --name enterprise-pos \
  --shape microservices \
  --gateway-port 8000 \
  --services "auth-service:node:express:8001:postgres:prisma:auth,catalog-service:python:fastapi:8002:mongodb:motor" \
  --extras docker,ci,env,git
```

### Microservices Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │  API Gateway (Express on Port 8000)  │
                      │   - Reverse Proxy Routing            │
                      │   - Request Correlation (x-req-id)   │
                      │   - Aggregated Health (/health)      │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │ Bridge Network: microservices-net             │
                 ▼                                               ▼
  ┌───────────────────────────────┐               ┌───────────────────────────────┐
  │  auth-service (Port 8001)     │               │  catalog-service (Port 8002)  │
  │   - Node.js + Express         │               │   - Python + FastAPI          │
  │   - Prisma ORM + PostgreSQL   │               │   - Motor ODM + MongoDB       │
  │   - JWT Auth & Token Issuance │               │   - Inter-service Auth Client │
  └──────────────┬────────────────┘               └──────────────┬────────────────┘
                 │                                               │
                 ▼                                               ▼
  ┌───────────────────────────────┐               ┌───────────────────────────────┐
  │  PostgreSQL Container (5432)  │               │  MongoDB Container (27017)    │
  └───────────────────────────────┘               └───────────────────────────────┘
```

### Configuration File Mode

```bash
pnpm --filter @project-scaffolder/cli exec scaffold new --config scaffold.config.json
```

---

## License

MIT © Universal Project Scaffolder Team
