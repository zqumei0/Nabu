---
status: accepted
date: 2026-08-23
---

# ADR-0005: Use Postgres for primary data storage

## Context

Nabu's core entities (tickets, vulnerabilities, organizations, users) are heavily relational, and the dashboard needs flexible ad hoc filtering/sorting/joining. The product is still in an exploratory/prototype stage, so schema and query patterns are expected to change frequently. See [`../../../research/2026-07-25-data-storage.md`](../../../research/2026-07-25-data-storage.md) for the full comparison against DynamoDB.

## Decision

Use Postgres (via AWS RDS/Aurora) as the primary data store.

## Consequences

- Natural fit for related entities and joins; supports the flexible, ad hoc filtering a tickets/vulnerabilities dashboard needs.
- ACID transactions make multi-step writes (e.g. create ticket + link vulnerability + update status) straightforward and safe — this also underpins [ADR-0004](0004-agent-service-architecture.md)'s automation-in-backend design, which relies on normal DB transactions.
- Mature Go tooling (pgx, sqlc, `database/sql`) and well-understood schema migration story (goose, atlas, golang-migrate) — easy to iterate on schema while the product itself is still being defined.
- Requires managing a stateful service (RDS/Aurora) alongside the stateless ECS backend — more operational surface than a fully managed NoSQL store, though this pairs naturally with the already-decided ECS Fargate hosting ([ADR-0002](0002-hosting-topology.md)).
- Trade-off accepted: horizontal write scaling is more work than DynamoDB's if volume ever grows dramatically. Not expected soon — scanner ingestion is likely periodic/batched rather than a sustained high-throughput firehose.
- Follow-up work: choose a migration tool, decide on `pgx`/`sqlc`/plain `database/sql`, and wire the DB driver into the backend scaffold (currently deferred — see `backend/CLAUDE.md`'s "Deferred" section).
- Revisit only if a specific, sustained high-volume write pattern emerges that a well-indexed Postgres instance genuinely can't handle.
