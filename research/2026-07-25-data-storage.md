---
topic: Data storage shape — relational vs. NoSQL
status: resolved
date: 2026-07-25
related_adr: ../docs/architecture/decisions/0005-postgres-data-storage.md
---

# Data Storage: Relational vs. NoSQL

## Question

Nabu is a ticketing and vulnerability management service with structured, related entities (tickets, vulnerabilities, organizations, users). What should the primary data store be — a relational database (e.g. Postgres) or a NoSQL store (e.g. DynamoDB)? Should also account for expected write volume from scanner/CI integrations ingesting results.

## Findings

The shape of the data and the shape of the queries both point the same direction here:

- The core entities are heavily relational — tickets reference vulnerabilities, both belong to organizations, and both are acted on by users. A dashboard over this data needs flexible filtering/sorting/joining (e.g. "open tickets for org X, severity ≥ high, assigned to me") — the kind of ad hoc querying relational databases are built for.
- The product is explicitly still in an exploratory/prototype stage (see `docs/knowledge/product-vision.md`) — the schema and query patterns will likely change frequently early on. NoSQL stores like DynamoDB require access patterns to be largely known upfront (single-table design, GSIs per query shape), which fights against a still-changing data model.
- Scanner ingestion is likely periodic/batched rather than a sustained high-throughput write firehose, so DynamoDB's main structural advantage (near-infinite write scaling) isn't clearly needed yet.
- Go has a mature Postgres ecosystem (pgx, sqlc, standard `database/sql`), and AWS RDS/Aurora Postgres pairs naturally with the already-decided ECS Fargate hosting (ADR-0002).

## Options Considered

### Relational (Postgres)

**Pros**
- Natural fit for related entities and joins; supports the flexible, ad hoc filtering a tickets/vulnerabilities dashboard needs.
- ACID transactions make multi-step writes (e.g. create ticket + link vulnerability + update status) straightforward and safe.
- Mature Go tooling and well-understood schema migration story (goose, atlas, golang-migrate).
- Easy to iterate on schema while the product itself is still being defined.

**Cons**
- Requires managing a stateful service (RDS/Aurora) alongside the stateless ECS backend — more operational surface than a fully managed NoSQL store.
- Horizontal scaling is more work than DynamoDB's if write volume ever grows dramatically (though read replicas and vertical scaling cover a large range first).

### NoSQL (DynamoDB)

**Pros**
- Fully managed, scales automatically, no server to size or patch.
- Handles bursty/spiky write volume well if scanner ingestion ever becomes very high-throughput.

**Cons**
- Requires committing to access patterns upfront (single-table design) — a poor fit while the data model is still expected to change.
- Ad hoc dashboard filtering/sorting across relationships is DynamoDB's weak point; would likely require duplicating data across item shapes per query pattern, adding real complexity.
- No native joins — relating tickets ↔ vulnerabilities ↔ orgs ↔ users would need to be modeled carefully and denormalized.

## Recommendation

**Postgres (relational)**. The data is inherently relational, the product needs flexible dashboard querying, and the schema is still actively changing — all three favor relational modeling over NoSQL's upfront-access-pattern commitment. Revisit only if a specific, sustained high-volume write pattern emerges that a well-indexed Postgres instance genuinely can't handle.
