# Changelog

All notable changes to the **Universal Project Scaffolder** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-14

### Added

- **Expanded Golden Templates (`@project-scaffolder/templates`)**:
  - `Node.js + Fastify Standalone`: High-performance TypeScript API with `@fastify/cors`, modular route plugins, and health checks.
  - `Node.js + NestJS Standalone`: Enterprise-tier modular architecture with TypeScript decorators, controllers, and services.
  - `Python + Flask Standalone`: Application factory pattern (`create_app`), modular Blueprints, and CORS support.
  - `Python + Django Standalone`: Batteries-included web framework with modular settings, ASGI/WSGI entrypoints, and JSON API routes.
  - `React + Next.js 15 Standalone`: App Router SSR/SSG server components, TypeScript, and API route handlers.
  - `.NET 8 + ASP.NET Core Web API Standalone`: C# 12 minimal API, OpenAPI/Swagger documentation, and health check endpoints.
  - `Flutter Standard Mobile/Desktop App`: Feature-first domain architecture with Material 3 design and widget test suites.
- **Preflight Checkers (`@project-scaffolder/preflight`)**:
  - `DotnetChecker`: .NET 8 SDK detection, semver requirement verification, and OS-specific manual installation instructions.
  - `FlutterChecker`: Flutter SDK runtime detection and platform installation guidance.
- **Database & ORM Fragments (`@project-scaffolder/templates`)**:
  - `Prisma ORM Fragment (Node.js)`: Dynamic multi-database support (PostgreSQL, MySQL, SQLite), Prisma client singleton, migration scripts, and Docker Compose database services.
  - `MongoDB + Mongoose Fragment (Node.js)`: Mongoose connection lifecycle manager, User schema model, and MongoDB Docker Compose service.
  - `MongoDB + Motor Fragment (Python)`: Async Motor client manager, Pydantic data models, and MongoDB Docker Compose service.
- **Operational Extras & Boilerplate (`@project-scaffolder/core`)**:
  - `Multi-Stage Dockerfile & Docker Compose Generator`: Generates optimized multi-stage container builds tailored to Node, Python, .NET, React, and Flutter runtime targets.
  - `GitHub Actions CI Workflow Generator`: Generates matrix CI testing pipelines tailored to the scaffolded technology stack.
  - `YAML & Docker Compose Deep Merge`: Added `mergeDockerCompose` to core merge engine to synthesize services and volumes seamlessly.
  - `JWT Authentication Boilerplate Fragments`: Composable token creation/verification, password hashing (`bcrypt`/`passlib`), Express & FastAPI auth routes (`/register`, `/login`, `/me`), and protected endpoints.
- **Testing & Quality Assurance**:
  - 12 comprehensive live smoke test suites covering compilation, bundling, and test runners across all 5 ecosystems.
  - 58 unit and integration tests passing with 100% test coverage on core engines.

## [0.1.0] - 2026-09-12

### Added

- **Core Generation Engine (`@project-scaffolder/core`)**:
  - Pure domain function `generate(answer, templateSource) -> FileOp[]` with zero disk I/O.
  - Zod validation schemas for `AnswerSchema` and `TemplateManifestSchema`.
  - Generalized fragment merge engine (`merge.ts`) with deep JSON merge, `.gitignore` deduplication, and `.env` variable synthesis.
  - Dynamic per-project README generator (`readme.ts`) generating stack summaries and exact next commands.
  - Hexagonal ports: `FileWriter`, `TemplateSource`, and adapters: `DiskFileWriter`, `MemoryFileWriter`.
- **Golden Templates (`@project-scaffolder/templates`)**:
  - `Node.js + Express Standalone`: runnable layered TypeScript API with health check route.
  - `Python + FastAPI Standalone`: runnable Python 3.10+ FastAPI project with Pydantic v2 and modular routers.
  - `React + Vite Standalone`: runnable React 18+ TypeScript SPA project.
  - `CORS & API Base URL Wiring Fragment`: composable fragment enabling seamless frontend-backend communication.
  - `Postgres + SQLAlchemy/Alembic Fragment`: async SQLAlchemy 2.0 models, Alembic migrations, and Docker Compose PostgreSQL service.
  - `FsTemplateSource`: filesystem template resolver adapter.
- **Preflight Package (`@project-scaffolder/preflight`)**:
  - Guided-manual runtime checker interface (`Checker`).
  - `NodeChecker` and `PythonChecker` with semver compatibility checking and OS-specific manual installation instructions.
  - Preflight runner with structured failure reporting.
- **CLI Shell Adapter (`@project-scaffolder/cli`)**:
  - `scaffold new` command implemented via `oclif` and `@clack/prompts`.
  - Interactive questionnaire matching PRD decision tree.
  - Non-interactive mode via CLI flags or JSON `--config` file producing byte-identical outputs.
  - Post-generation `--git` repository initialization and initial commit creation.
  - Preflight prompt integration with `--force` and `--skip-preflight` bypass flags.
- **Testing & CI Matrix**:
  - 17 test files and 49 unit, integration, and smoke tests.
  - GitHub Actions multi-OS (`ubuntu-latest`, `windows-latest`, `macos-latest`), multi-Node (`20.x`, `22.x`), and Python 3.11 CI matrix.
  - Live smoke tests executing real package installations, bundle builds, and development servers.
