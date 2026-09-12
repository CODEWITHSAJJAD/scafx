# Changelog

All notable changes to the **Universal Project Scaffolder** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
