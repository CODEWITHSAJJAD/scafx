# scafx

Next-Generation Multi-Ecosystem Architecture & Project Scaffolder CLI.

## Quick Start

```bash
npx scafx new
```

Or install globally:

```bash
npm install -g scafx
scafx new
```

## Features

- **Multi-Ecosystem Support**: Node.js (Express, Fastify, NestJS), Python (FastAPI, Flask, Django), .NET 8 (Web API), React (Vite, Next.js 15), Flutter (Standard).
- **Architectural Shapes**: Standalone API/App, Composable Full-Stack Monorepo, and Distributed Microservices with Express Gateway.
- **Database & ORM Integrations**: PostgreSQL, MongoDB, MySQL, SQLite with Prisma, SQLAlchemy 2.0/Alembic, Entity Framework Core, Mongoose, Motor.
- **Production Boilerplates**: Dockerfiles, Docker Compose, GitHub Actions CI, JWT Auth, and preflight runtime diagnostics.

## CLI Usage

### Interactive Wizard

```bash
scafx new
```

### Non-Interactive Flags

```bash
# Node + Fastify API with PostgreSQL & Prisma
scafx new --name my-api --stack node --framework fastify --db postgres --orm prisma --extras auth,docker,ci,git

# Python + FastAPI with MongoDB & Motor
scafx new --name my-api --stack python --framework fastapi --db mongodb --orm motor --extras auth,docker,ci,git

# Full-Stack React + FastAPI Monorepo
scafx new --name my-app --shape fullstack --frontend-stack react --frontend-framework vite --backend-stack python --backend-framework fastapi --extras docker,ci,git

# Microservices Topology
scafx new --name pos-mesh --shape microservices --gateway-port 8000 --services "auth-service:node:express:8001:postgres:prisma:auth,catalog-service:python:fastapi:8002:mongodb:motor" --extras docker,ci,git
```

### Config File

```bash
scafx new --config scaffold.config.json
```

## Documentation & Repository

- **GitHub Repository**: [CODEWITHSAJJAD/scafx](https://github.com/CODEWITHSAJJAD/scafx)
- **Website & Documentation**: [scafx Launch Platform](https://github.com/CODEWITHSAJJAD/scafx-web)

## License

All rights reserved to CODEWITHSAJJAD. Licensed under MIT.
