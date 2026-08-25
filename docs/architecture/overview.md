# Architecture Overview

This is the "Overall" design document — system-level architecture and how the other design documents relate to it and each other. See [Design Documents](#design-documents) below for the full set.

## System Overview

Nabu is a monorepo containing infrastructure-as-code, a frontend, a backend, and an agent-facing product component. This document describes how the pieces fit together as they're decided; unresolved questions are tracked under Open Decisions below and promoted to an ADR (see `decisions/`) once settled.

## Service Boundaries

- **`infra/`** — AWS CDK, TypeScript. Owns provisioning for all other services.
- **`frontend/`** — TypeScript, Vite + React SPA (see [ADR-0007](decisions/0007-vite-react-frontend.md)). Web dashboard is the primary interface. Not yet scaffolded.
- **`backend/`** — Go (see [ADR-0001](decisions/0001-go-for-backend-language.md)). Core application/API logic, plus backend automation (triage, ticket creation/update — see [ADR-0004](decisions/0004-agent-service-architecture.md)). Initial scaffold in place.
- **Agent-facing component** — split ([ADR-0004](decisions/0004-agent-service-architecture.md)): a dedicated chat service (TypeScript, Claude Agent SDK, direct Anthropic API) for the customer-facing assistant, and automation embedded directly in `backend/`.

## Data Flow

Human users authenticate via OAuth/OIDC (GitHub first) and hit the dashboard (Vite+React SPA) which calls the Go backend; scanner/CI integrations authenticate via scoped API keys and push scan results to the backend, which triages/dedupes and creates or updates tickets in Postgres (see [ADR-0006](decisions/0006-oauth-and-api-key-auth.md), [ADR-0005](decisions/0005-postgres-data-storage.md)). The chat service is a separate path: it talks to its own Claude Agent SDK-managed context/tools and to the backend for ticket/vulnerability data as needed. Full request/response shapes are still to be documented in [`data-model.md`](data-model.md) and the service `docs/design.md` files as those get fleshed out.

## Resolved Decisions

- **Backend language** — Go. See [ADR-0001](decisions/0001-go-for-backend-language.md).
- **Hosting topology** — frontend on S3+CloudFront, backend on ECS Fargate. See [ADR-0002](decisions/0002-hosting-topology.md).
- **CI/CD** — GitHub Actions. See [ADR-0003](decisions/0003-cicd-github-actions.md).
- **Agent-service architecture** — split (dedicated chat service + automation embedded in the backend); Claude Agent SDK on direct Anthropic API. See [ADR-0004](decisions/0004-agent-service-architecture.md).
- **Data storage** — Postgres. See [ADR-0005](decisions/0005-postgres-data-storage.md).
- **Auth/integration model** — OAuth/OIDC (humans) + scoped API keys (machine integrations). See [ADR-0006](decisions/0006-oauth-and-api-key-auth.md).
- **Frontend framework** — Vite + React SPA. See [ADR-0007](decisions/0007-vite-react-frontend.md).

## Open Decisions

None currently open. New research topics get tracked in [`research/`](../../research/README.md) and promoted to an ADR in [`decisions/`](decisions/) here once settled.

## Design Documents

Living documents describing the current, evolving shape of each component (distinct from research — pre-decision investigation — and ADRs — single point-in-time decisions):

- [`data-model.md`](data-model.md) — core entities, relationships, lifecycle/state
- [`agentic-design.md`](agentic-design.md) — chat interface, backend automation, tool surface
- [`../../frontend/docs/design.md`](../../frontend/docs/design.md) — routing, component architecture, state management
- [`../../backend/docs/design.md`](../../backend/docs/design.md) — package structure, API surface, error handling
