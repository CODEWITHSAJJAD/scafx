# scafx

<div align="center">

```
  ____   ____    _     _____  __  __
 / ___| / ___|  / \   |  ___|\ \/ /
 \___ \| |     / _ \  | |_    \  /
  ___) | |___ / ___ \ |  _|   /  \
 |____/ \____/_/   \_\|_|    /_/\_\
```

**Next-Generation Multi-Ecosystem Architecture & Project Scaffolder**

[![npm version](https://img.shields.io/npm/v/scafx.svg?style=flat-square&color=000000)](https://www.npmjs.com/package/scafx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)

[**Launch Website**](https://github.com/CODEWITHSAJJAD/scafx-web) • [**Report Bug**](https://github.com/CODEWITHSAJJAD/scafx/issues) • [**Request Feature**](https://github.com/CODEWITHSAJJAD/scafx/issues)

</div>

---

## ⚡ Quick Start

Run instantly with zero installation via `npx`:

```bash
npx scafx new
```

Or install globally:

```bash
npm install -g scafx
scafx new
```

---

## 🎯 What is scafx?

**`scafx`** is a high-performance, architecture- and database-aware CLI tool engineered to scaffold production-ready enterprise applications across **Node.js, Python, .NET, React, and Flutter**.

Unlike generic scaffolding tools that generate simple hello-world starters, `scafx` delivers battle-tested, idiomatic software architectures with:

- **Clean Hexagonal / Ports-and-Adapters Architecture**
- **First-class Full-Stack Monorepo Composition** (e.g. React 18 / Next.js 15 + FastAPI / Express)
- **Distributed Microservices Mesh Orchestration** with Express API Gateway, reverse proxy routing, correlation ID tracing (`x-request-id`), aggregated health checks, and Docker Compose networks
- **Automated Guided Preflight Diagnostics** for local runtimes (Node, Python, .NET SDK, Flutter SDK)
- **Production Boilerplates**: Multi-stage Dockerfiles, Docker Compose, GitHub Actions CI, Prisma / SQLAlchemy 2.0 / EF Core / Motor ORMs, and JWT Authentication flows.

---

## 🏗️ Supported Ecosystems & Frameworks

| Ecosystem   | Frameworks                          | Database Options                   | ORMs / ODMs                     | Included Extras                |
| :---------- | :---------------------------------- | :--------------------------------- | :------------------------------ | :----------------------------- |
| **Node.js** | Express, Fastify, NestJS            | PostgreSQL, MySQL, SQLite, MongoDB | Prisma, Mongoose                | Docker, CI, JWT Auth, Git, Env |
| **Python**  | FastAPI, Flask, Django              | PostgreSQL, MongoDB, SQLite        | SQLAlchemy 2.0 / Alembic, Motor | Docker, CI, JWT Auth, Git, Env |
| **.NET**    | ASP.NET Core Web API (Minimal API)  | PostgreSQL, SQLite                 | Entity Framework Core           | Docker, CI, Git, Env           |
| **React**   | Vite (SPA), Next.js 15 (App Router) | Full-Stack Composable              | Composable with Backend         | Docker, CI, Git, Env           |
| **Flutter** | Flutter Standard (Material 3)       | SQLite / Local                     | Drift / Local                   | CI, Git, Env                   |

---

## 🚀 Golden Templates

1. **Node.js + Express Standalone**: TypeScript, layered architecture (routes, controllers, services), healthcheck endpoints, and Vitest test suite.
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
12. **Express API Gateway**: Reverse proxy router with `x-request-id` tracing, dynamic path routing (`/api/<service>/*`), and aggregated healthchecks.
13. **Microservices Monorepo**: Gateway + multi-service topology (Auth Service, Catalog Service, Domain Services) with unified Docker Compose bridge network and dedicated databases.

---

## 💻 CLI Usage

### 1. Interactive Wizard

Launch the interactive prompt UI powered by `@clack/prompts`:

```bash
scafx new
```

### 2. Non-Interactive CLI Flags

Scaffold projects instantly in automated CI/CD pipelines or scripts:

```bash
# Standalone Node + Fastify API with PostgreSQL & Prisma + JWT Auth + Docker
scafx new \
  --name my-fastify-api \
  --stack node \
  --framework fastify \
  --shape standalone \
  --db postgres \
  --orm prisma \
  --extras auth,docker,ci,git

# Standalone Python + FastAPI with MongoDB & Motor + JWT Auth
scafx new \
  --name my-mongo-api \
  --stack python \
  --framework fastapi \
  --shape standalone \
  --db mongodb \
  --orm motor \
  --extras auth,docker,ci,git

# Full-Stack React + FastAPI Monorepo
scafx new \
  --name my-fullstack-app \
  --shape fullstack \
  --frontend-stack react \
  --frontend-framework vite \
  --backend-stack python \
  --backend-framework fastapi \
  --db postgres \
  --orm sqlalchemy \
  --extras auth,docker,ci,git

# Microservices Topology (Express Gateway + Node Auth Service + Python FastAPI Catalog)
scafx new \
  --name enterprise-system \
  --shape microservices \
  --gateway-port 8000 \
  --services "auth-service:node:express:8001:postgres:prisma:auth,catalog-service:python:fastapi:8002:mongodb:motor" \
  --extras docker,ci,env,git
```

### 3. Declarative Configuration File (`scaffold.config.json`)

Pass a version-controlled configuration file to guarantee byte-identical scaffolding:

```bash
scafx new --config scaffold.config.json
```

Example `scaffold.config.json`:

```json
{
  "projectName": "pos-microservices",
  "appShape": "microservices",
  "gateway": { "port": 8000 },
  "services": [
    {
      "name": "auth-service",
      "stack": "node",
      "framework": "express",
      "port": 8001,
      "database": "postgres",
      "orm": "prisma",
      "extras": ["auth"]
    },
    {
      "name": "catalog-service",
      "stack": "python",
      "framework": "fastapi",
      "port": 8002,
      "database": "mongodb",
      "orm": "motor"
    }
  ],
  "extras": ["docker", "ci", "env", "git"]
}
```

---

## 🌐 Microservices Architecture Topology

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

---

## 📦 Monorepo Architecture

```
packages/
  ├── core/          # Domain contracts, schema validation, template synthesis, AST transforms
  ├── cli/           # CLI shell adapter (oclif command layer + @clack/prompts interactive UI)
  ├── preflight/     # Runtime environment detection (Node, Python, .NET, Flutter)
  └── templates/     # Golden templates, reusable fragments, and template loader
```

---

## 🛠️ Development & Contributing

### Setup

```bash
# Clone the repository
git clone https://github.com/CODEWITHSAJJAD/scafx.git
cd scafx

# Install workspace dependencies
pnpm install

# Build all packages in topological order
pnpm -r build
```

### Running Tests

```bash
# Run unit tests across all packages
pnpm run test:unit

# Run full golden template smoke tests (executes real compiler & test suites)
pnpm run test:smoke

# Run full test suite
pnpm test
```

---

## 📄 License

All rights reserved to **CODEWITHSAJJAD**. Licensed under the [MIT License](LICENSE).
