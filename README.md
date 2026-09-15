# scafx

<div align="center">

```
  ____   ____    _     _____  __  __
 / ___| / ___|  / \   |  ___|\ \/ /
 \___ \| |     / _ \  | |_    \  /
  ___) | |___ / ___ \ |  _|   /  \
 |____/ \____/_/   \_\|_|    /_/\_\
```

**Next-Generation Multi-Ecosystem Architecture & Polyglot Project Scaffolder**

[![npm version](https://img.shields.io/npm/v/@codewithsajjad01/scafx.svg?style=flat-square&color=000000)](https://www.npmjs.com/package/@codewithsajjad01/scafx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)

[**Launch Website**](https://github.com/CODEWITHSAJJAD/scafx) • [**Report Bug**](https://github.com/CODEWITHSAJJAD/scafx/issues) • [**Request Feature**](https://github.com/CODEWITHSAJJAD/scafx/issues)

</div>

---

## ⚡ Quick Start & Installation

### Option 1: Instant Execution (Zero Install via `npx` / `pnpm dlx` / `bunx`)

```bash
# Using npm / npx
npx @codewithsajjad01/scafx new

# Using pnpm dlx
pnpm dlx @codewithsajjad01/scafx new

# Using bunx
bunx @codewithsajjad01/scafx new
```

### Option 2: Global Installation

```bash
npm install -g @codewithsajjad01/scafx
scafx new
```

---

## 🎯 What is scafx?

**`scafx`** is an architecture- and database-aware CLI tool engineered to scaffold production-ready enterprise applications across **Node.js / TypeScript, Python, .NET 8 (C# 12), React / Next.js, and Flutter**.

Unlike generic scaffolding tools that generate simple starter templates, `scafx` delivers battle-tested, idiomatic software architectures with:

- **15 Architectural Styles**: Clean Hexagonal / Ports-and-Adapters, Feature-First / Modular, Layered (3-Tier), MVC, Vertical Slice, BLoC, Riverpod.
- **Multi-Hosting Database Architecture**: Self-hosted containerized databases (PostgreSQL, MySQL, MariaDB, MongoDB, SQLite, Redis) and Cloud-managed services (Supabase, Neon Serverless Postgres, CockroachDB Cloud, MongoDB Atlas, Azure CosmosDB, Google Cloud SQL, Firestore).
- **Migration Tooling Integration**: Native ORM migration engines (Prisma Migrate, Drizzle Kit, EF Core, Alembic, Aerich) alongside Universal Database Migration Tooling (**Flyway** & **Liquibase**).
- **Enterprise Message Queuing & Streaming**: RabbitMQ, Apache Kafka, Redis Streams, BullMQ, Celery, Azure Service Bus, AWS SQS.
- **First-class Full-Stack Monorepo Composition**: Frontend SPA (React / Vite / Next.js) + Backend API (FastAPI / Express / Fastify / .NET) cross-wired automatically.
- **Distributed Microservices Mesh Orchestration**: Express Reverse Proxy API Gateway with `x-request-id` tracing, route proxying, aggregated health checks, and multi-container Docker bridge networks.
- **Automated Guided Preflight Diagnostics**: Runtime semver validation across Node.js, Python, .NET SDK, and Flutter SDK before code generation.
- **Production Developer Extras**: Multi-stage Dockerfiles, Docker Compose, GitHub Actions CI matrices, Linters & Formatters (ESLint, Prettier, Ruff, Black, dotnet format, dart analyze), Dynamic `.env` generation, and Git initialization.

---

## 🏗️ Master Polyglot Architecture & Tooling Matrix

| Ecosystem | Supported Frameworks | Architectural Styles | Native ORMs & Query Builders | Migration Engines | Message Queues & Tasks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node.js & TypeScript** | Express 4/5, Fastify 4/5, NestJS | • Layered (3-Tier)<br>• Clean Hexagonal<br>• Feature-First / Modular<br>• MVC<br>• Microservices Node RPC | • Prisma<br>• Drizzle ORM<br>• TypeORM<br>• Mongoose (MongoDB) | • Prisma Migrate<br>• Drizzle Kit<br>• TypeORM Migrations<br>• **Flyway** / **Liquibase** | • RabbitMQ (`amqplib`)<br>• Apache Kafka (`kafkajs`)<br>• Redis Streams / BullMQ |
| **Python** | FastAPI, Flask, Django | • Layered (3-Tier)<br>• Clean Hexagonal<br>• Feature-First / Modular<br>• MVC<br>• Microservices Worker | • SQLAlchemy 2.0<br>• Tortoise ORM<br>• Motor (MongoDB Async)<br>• Django ORM | • Alembic<br>• Aerich<br>• Django Migrations<br>• **Flyway** / **Liquibase** | • Celery (`redis`/`amqp`)<br>• RabbitMQ (`pika`)<br>• Apache Kafka (`confluent-kafka`) |
| **.NET 8 (C# 12)** | ASP.NET Core Web API, Minimal API, MVC, Blazor Server/Wasm | • Layered (3-Tier)<br>• Clean Hexagonal<br>• Feature-Sliced (Vertical)<br>• MVC / Razor<br>• Microservices Worker | • Entity Framework Core 8<br>• Dapper (Micro-ORM) | • EF Core Migrations<br>• DbUp<br>• **Flyway** / **Liquibase** | • RabbitMQ (`RabbitMQ.Client`)<br>• Apache Kafka (`Confluent.Kafka`)<br>• Azure Service Bus / AWS SQS |
| **React / Web** | Vite (SPA), Next.js 15 (App Router) | • Feature-First<br>• Component-Driven Atomic<br>• Next.js App Router Layered | • Composable via Backend APIs<br>• LocalStorage / IndexedDB | • Handled by Backend ORM | • WebSockets / Server-Sent Events |
| **Flutter / Mobile** | Flutter 3.24+ (Dart 3) | • Feature-First Clean<br>• BLoC Pattern<br>• Riverpod Architecture | • Drift (SQLite)<br>• Hive (NoSQL)<br>• Isar Database | • Drift Schema Migrations | • Firebase Cloud Messaging (FCM)<br>• MQTT / WebSocket background client |

---

## 💻 CLI Usage Guide

### 1. Interactive Guided Wizard

Launch the interactive prompt CLI powered by `@clack/prompts`:

```bash
scafx new
```

The interactive wizard dynamically adapts prompts based on your selections (target shape, language ecosystem, framework, architectural style, database engine, hosting mode, migration tool, message queues, and developer tooling extras).

---

### 2. Non-Interactive CLI Automation Flags

Scaffold projects instantly in automated CI/CD pipelines, Docker scripts, or shell automations:

#### Standalone Node + Fastify API with PostgreSQL & Prisma + Flyway + Docker:
```bash
scafx new \
  --name my-fastify-service \
  --shape standalone \
  --stack node \
  --framework fastify \
  --architecture layered \
  --db postgres \
  --db-hosting self-hosted \
  --orm prisma \
  --migration flyway \
  --queue rabbitmq \
  --extras auth,docker,ci,lint,env,git
```

#### Standalone Python + FastAPI with MongoDB & Motor + Kafka + JWT Auth:
```bash
scafx new \
  --name catalog-service \
  --shape standalone \
  --stack python \
  --framework fastapi \
  --architecture clean \
  --db mongodb \
  --db-hosting cloud-atlas \
  --orm motor \
  --queue kafka \
  --extras auth,docker,ci,lint,env,git
```

#### Standalone .NET 8 Web API with PostgreSQL & EF Core + RabbitMQ:
```bash
scafx new \
  --name payment-service \
  --shape standalone \
  --stack dotnet \
  --framework webapi \
  --architecture clean \
  --db postgres \
  --orm efcore \
  --queue rabbitmq \
  --extras docker,ci,lint,env,git
```

#### Full-Stack React + FastAPI Monorepo:
```bash
scafx new \
  --name enterprise-portal \
  --shape fullstack \
  --frontend-stack react \
  --frontend-framework vite \
  --backend-stack python \
  --backend-framework fastapi \
  --db postgres \
  --orm sqlalchemy \
  --extras auth,docker,ci,lint,env,git
```

#### Distributed Microservices Topology:
```bash
scafx new \
  --name enterprise-mesh \
  --shape microservices \
  --gateway-port 8000 \
  --services "auth-service:node:express:8001:postgres:prisma:auth,catalog-service:python:fastapi:8002:mongodb:motor" \
  --extras docker,ci,env,git
```

---

### 3. Declarative Manifest Configuration (`scaffold.config.json`)

Pass a version-controlled JSON configuration file to guarantee byte-identical scaffolding:

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
      "architecture": "layered",
      "port": 8001,
      "database": "postgres",
      "dbHosting": "self-hosted",
      "orm": "prisma",
      "migrationTool": "flyway",
      "messageQueue": "rabbitmq",
      "extras": ["auth", "lint"]
    },
    {
      "name": "catalog-service",
      "stack": "python",
      "framework": "fastapi",
      "architecture": "clean",
      "port": 8002,
      "database": "mongodb",
      "dbHosting": "cloud-atlas",
      "orm": "motor",
      "messageQueue": "kafka"
    }
  ],
  "extras": ["docker", "ci", "env", "git"]
}
```

---

## 🌐 Distributed Microservices Architecture Mesh

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
  │   - Prisma ORM + PostgreSQL   │               │   - Motor ODM + MongoDB Atlas │
  │   - RabbitMQ Message Broker   │               │   - Apache Kafka Event Client │
  │   - Flyway Schema Migrations  │               │   - Inter-service Auth Client │
  └──────────────┬────────────────┘               └──────────────┬────────────────┘
                 │                                               │
                 ▼                                               ▼
  ┌───────────────────────────────┐               ┌───────────────────────────────┐
  │  PostgreSQL Container (5432)  │               │  MongoDB Atlas Cloud Service  │
  └───────────────────────────────┘               └───────────────────────────────┘
```

---

## 📦 Monorepo Structure

```
scafx/
├── packages/
│   ├── core/          # Domain engine, schema validation, synthesis compiler, AST transforms
│   ├── cli/           # CLI shell adapter (oclif command layer + @clack/prompts interactive UI)
│   ├── preflight/     # Guided runtime environment detectors (Node, Python, .NET, Flutter)
│   └── templates/     # Atomic templates, architectures, databases, queues, gateways, fragments
├── website/           # Developer launch website & interactive documentation (React 18 + Vite)
└── .github/
    └── workflows/     # GitHub Actions CI matrix and automated Release workflows
```

---

## 🛠️ Development & Testing

```bash
# Clone the repository
git clone https://github.com/CODEWITHSAJJAD/scafx.git
cd scafx

# Install monorepo dependencies
pnpm install

# Build all packages in topological dependency order
pnpm -r build

# Run all unit tests across packages
pnpm run test:unit

# Run full smoke matrix test suites
pnpm run test:smoke

# Start the interactive documentation website
pnpm --dir website dev
```

---

## 📄 License & Attribution

Author: **CODEWITHSAJJAD**  
Repository: [https://github.com/CODEWITHSAJJAD/scafx](https://github.com/CODEWITHSAJJAD/scafx)  
Licensed under the [MIT License](LICENSE).
