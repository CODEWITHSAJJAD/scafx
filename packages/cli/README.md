# @codewithsajjad01/scafx

Next-Generation Multi-Ecosystem Architecture & Polyglot Project Scaffolder CLI.

[![npm version](https://img.shields.io/npm/v/@codewithsajjad01/scafx.svg?style=flat-square&color=000000)](https://www.npmjs.com/package/@codewithsajjad01/scafx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## ⚡ Quick Start & Installation

Run instantly without installation:

```bash
npx @codewithsajjad01/scafx new
```

Or using `pnpm` / `bun`:

```bash
pnpm dlx @codewithsajjad01/scafx new
bunx @codewithsajjad01/scafx new
```

Or install globally:

```bash
npm install -g @codewithsajjad01/scafx
scafx new
```

---

## 🚀 Key Features

- **5 Polyglot Ecosystems**: Node.js / TypeScript, Python, .NET 8 (C# 12), React / Next.js, Flutter (Dart 3).
- **15 Architectural Coding Styles**: Clean Hexagonal, Feature-First / Modular, Layered (3-Tier), MVC, Vertical Slice, BLoC, Riverpod.
- **Multi-Hosting Databases**: Self-hosted Docker (PostgreSQL, MySQL, MongoDB, SQLite, Redis) and Cloud-managed (Supabase, Neon, CockroachDB, Atlas, CosmosDB, CloudSQL, Firestore).
- **Dedicated Migration Tooling**: ORM native migrations + Universal **Flyway** and **Liquibase** migrations.
- **Enterprise Message Queues**: RabbitMQ, Apache Kafka, Redis Streams / BullMQ, Celery, Azure Service Bus, AWS SQS.
- **Architectural Topologies**: Standalone API/App, Composable Full-Stack Monorepo, and Distributed Microservices with Express Reverse Proxy Gateway.
- **Guided Preflight Diagnostics**: Runtime semver validation before code generation.
- **Production Extras**: Multi-stage Dockerfiles, Docker Compose, GitHub Actions CI, Code Linters & Formatters, Dynamic `.env` generator, and Git initialization.

---

## 💻 CLI Usage

### Interactive Wizard

```bash
scafx new
```

### Automation Flags

```bash
# Node + Fastify API with PostgreSQL & Prisma + Flyway + Docker
scafx new --name my-api --stack node --framework fastify --architecture layered --db postgres --orm prisma --migration flyway --extras auth,docker,ci,lint,env,git

# Python + FastAPI with MongoDB & Motor + Kafka + JWT Auth
scafx new --name catalog-service --stack python --framework fastapi --architecture clean --db mongodb --db-hosting cloud-atlas --orm motor --queue kafka --extras auth,docker,ci,lint,env,git

# .NET 8 Web API with PostgreSQL & EF Core + RabbitMQ
scafx new --name order-service --stack dotnet --framework webapi --architecture clean --db postgres --orm efcore --queue rabbitmq --extras docker,ci,lint,env,git

# Full-Stack React + FastAPI Monorepo
scafx new --name my-app --shape fullstack --frontend-stack react --frontend-framework vite --backend-stack python --backend-framework fastapi --db postgres --orm sqlalchemy --extras docker,ci,lint,env,git

# Distributed Microservices Topology
scafx new --name pos-mesh --shape microservices --gateway-port 8000 --services "auth-service:node:express:8001:postgres:prisma:auth,catalog-service:python:fastapi:8002:mongodb:motor" --extras docker,ci,env,git
```

### Declarative JSON Config File

```bash
scafx new --config scaffold.config.json
```

---

## 📄 Documentation & Links

- **GitHub Repository**: [https://github.com/CODEWITHSAJJAD/scafx](https://github.com/CODEWITHSAJJAD/scafx)
- **Author**: **CODEWITHSAJJAD**
- **License**: MIT
