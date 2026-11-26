---
status: accepted
---

# Single-User Self-Hosted Scope Without Multi-Tenancy

FinPulse is designed as a single-user, self-hosted personal finance application with no `User` or `Tenant` scoping in the financial domain. The free Meu Pluggy tier is restricted to connecting a single individual's own bank accounts, so multi-user Open Finance ingestion is not possible under the free personal tier.

## Considered Options

- **Multi-tenant SaaS from day one**: Rejected because Meu Pluggy's free tier cannot onboard external users' bank accounts, and adding `tenant_id`, auth flows, and per-user secret management would bloat the core financial domain with unused SaaS boilerplate.
- **Single-user self-hosted (chosen)**: Keeps the domain model focused on personal finance and Open Finance ingestion; public portfolio showcasing can be served later via a seeded demo mode with synthetic data rather than real multi-user bank connections.

## Consequences

- Domain entities (`Account`, `Transaction`, `Category`, `SyncRun`) carry no `userId` or `tenantId`.
- If remote deployment requires access control later, a thin authentication gate can sit at the HTTP edge without changing the domain core.
