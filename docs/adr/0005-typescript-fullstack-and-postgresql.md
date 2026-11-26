---
status: accepted
---

# TypeScript Full-Stack Hexagonal Monorepo with PostgreSQL

FinPulse uses a lean `pnpm` workspaces TypeScript monorepo backed by PostgreSQL: `apps/api` (Node.js + TypeScript + Fastify + Drizzle ORM), `apps/web` (React + Vite + TypeScript SPA), and `packages/contracts` (shared Zod schemas and API DTOs). The backend follows a hexagonal (ports-and-adapters) structure where `apps/api/src/domain/` contains pure TypeScript domain logic with zero imports from Fastify, Drizzle, or Pluggy, isolated from `apps/api/src/adapters/` (`http/`, `persistence/`, `pluggy/`).

## Considered Options

- **Python (FastAPI or Django + Django Ninja) + React/TS + PostgreSQL**: Leverages existing Python familiarity, but introduces two separate languages and toolchains (`uv`/`pytest`/`ruff` + `pnpm`/`vitest`), lacks Pluggy's official TypeScript SDK, and (with Django) pulls toward Active Record coupling.
- **Go or Java (Spring Boot) + React/TS + PostgreSQL**: Strong typing and boundaries, but adds a second toolchain and steeper ramp-up alongside React/TS.
- **Monolithic Next.js full-stack app**: Single TypeScript toolchain, but adds SSR/RSC complexity unnecessary for a private personal finance dashboard and blurs backend/frontend architectural boundaries.
- **TypeScript Full-Stack Hexagonal Monorepo (`apps/api` + `apps/web` + `packages/contracts`) + PostgreSQL (chosen)**: Unifies language and toolchain (`pnpm`, Vitest, Biome), leverages Pluggy's official TypeScript SDK behind an Anti-Corruption Layer, keeps Drizzle SQL explicit without Active Record bleed, and makes hexagonal boundaries physically visible in the folder structure.

## Consequences

- Monetary math uses integer minor units (`Money` value object, per ADR-0001) rather than relying on a language-native decimal type.
- Backend and frontend share contract schemas via `packages/contracts`, preventing API drift.
- PostgreSQL runs locally via Docker Compose (separate dev and test databases) so Vitest tests cover pure domain unit tests, Pluggy ACL fixture contract tests, and real Postgres integration tests.
- Pluggy integration supports `mock` and `live` adapter modes so local development and testing never require hitting the real Open Finance API.
