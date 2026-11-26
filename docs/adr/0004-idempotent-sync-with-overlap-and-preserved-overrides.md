---
status: accepted
---

# Idempotent Pull Sync with Overlap Window and Preserved Manual Overrides

Each `SyncRun` pulls accounts and transactions from Meu Pluggy on demand and reconciles them idempotently using `(provider, externalId)` as a database-enforced unique key. Provider-owned fields and user-owned overrides are stored separately so re-syncs update bank settlement state without ever clobbering manual user edits.

## Considered Options

- **Webhooks from Pluggy**: Rejected for Spec 1 because personal/local self-hosted setups do not have a guaranteed public HTTPS endpoint, and pull sync is simpler and deterministic to test.
- **Fetch only strictly after the last sync timestamp**: Rejected because Open Finance transactions stay `PENDING` for days before settling to `POSTED` (or disappearing when scheduled payments are cancelled), which would miss state transitions.
- **Pull sync with 90-day initial window, 15-day incremental overlap, and split provider/override fields (chosen)**: Captures late settlement transitions and vanished `PENDING` records safely while guaranteeing zero duplicates and preserving every `Manual Override`.

## Consequences

- Only one `SyncRun` may be `RUNNING` at a time; concurrent sync triggers fail fast with a conflict error.
- Re-syncs update provider fields (`status`, `amount`, `date`, `description`, `providerCategory`), never user overrides (`categoryOverride`, `kindOverride`).
- Previously synced `PENDING` transactions that vanish from Pluggy within the fetched overlap window are marked `CANCELLED` instead of lingering indefinitely.
- Monthly summaries include only `POSTED` transactions; `PENDING` transactions remain visible in the ledger with a visual status badge.
