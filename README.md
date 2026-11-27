# FinPulse

Personal finance manager powered by Open Finance (Banco Inter personal accounts via Meu Pluggy).

## Local setup

Use Node.js 22.13 or later in the 22.x line, 24.x, or 26+, the pnpm version pinned in `package.json`, and Docker Compose v2.
Copy `.env.example` to `.env` before running these commands.

```sh
pnpm install
docker compose up -d --wait
pnpm dev
```

Open the URL printed by Vite. The web app proxies `/api/health` to Fastify. The API returns HTTP 200 when it can query PostgreSQL and HTTP 503 when the database is unavailable.

Compose initializes `finpulse_dev` and `finpulse_test` in its PostgreSQL volume on first startup. Keep the connection URLs in `.env` in sync with the local PostgreSQL credentials and port. The API uses `DATABASE_URL` and defaults to port 3000 and the `America/Sao_Paulo` timezone.

## Workspace checks

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

Run `pnpm format` to apply formatting. `pnpm test` runs every Vitest project and requires the Compose database at `TEST_DATABASE_URL`. Run `pnpm test:unit` for domain, configuration, and web tests without PostgreSQL, or `pnpm test:integration` for the API and PostgreSQL suite.

## Development Workflow

This repository follows **Spec-Driven Development** using [mattpocock/skills](https://github.com/mattpocock/skills):

`grill-with-docs` → `to-spec` → `to-tickets` → `implement-spec` (TDD + subagents) → `code-review` → `pr` → `retro`
