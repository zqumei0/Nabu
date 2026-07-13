# Architecture Overview

## System Overview

Nabu is a monorepo containing infrastructure-as-code, a frontend, a backend, and an agent-facing product component. This document describes how the pieces fit together as they're decided; unresolved questions are tracked under Open Decisions below and promoted to an ADR (see `decisions/`) once settled.

## Service Boundaries

- **`infra/`** — AWS CDK, TypeScript. Owns provisioning for all other services.
- **`frontend/`** — TypeScript. User-facing website.
- **`backend/`** — language TBD (Go, Rust, or Java under consideration). Core application/API logic.
- **Agent-facing component** — not yet scoped. May be a customer-facing chat/assistant, backend automation, or both. Likely implemented as a separate service (candidate: a small TypeScript service using the Claude Agent SDK) rather than embedded directly in the backend, since none of the backend language candidates have an official Agent SDK. Not yet decided — see Open Decisions.

## Data Flow

To be documented once the backend language and agent-component shape are decided.

## Open Decisions

- **Backend language** — Go vs. Rust vs. Java. Not yet decided.
- **Agent-product shape** — customer-facing chat, backend automation, or both. Not yet decided.
- **Agent-service architecture** — whether the agent component is a separate service vs. embedded in the backend. Leaning separate service (see above), not yet finalized.

Once each of these is settled, record the decision and rationale as an ADR in [`decisions/`](decisions/) and update this doc to reflect the resolved state.
