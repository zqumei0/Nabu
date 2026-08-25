---
status: accepted
date: 2026-07-25
---

# ADR-0002: Hosting topology — S3+CloudFront (frontend), ECS Fargate (backend)

## Context

Nabu already uses AWS CDK for infra. A hosting topology was needed for both the frontend (web dashboard) and backend (Go API).

## Decision

- Frontend: static hosting via S3, served through CloudFront.
- Backend: containerized Go service running on ECS Fargate.

## Consequences

- Both sides have well-trodden, well-documented CDK constructs — low setup friction.
- Fargate avoids the cold-start tradeoffs a Go API would face on Lambda, which matters for a dashboard-backing API expected to serve interactive traffic.
- Revisit if traffic patterns or cost profile change significantly (e.g. very spiky/low-volume traffic could make Lambda more attractive later).
