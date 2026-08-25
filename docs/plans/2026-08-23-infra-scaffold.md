---
title: Stand up infra (CDK) — network, backend hosting, frontend hosting, database, CI/CD role
status: proposed
created: 2026-08-23
updated: 2026-08-23
---

# Plan: Stand up infra (CDK) — network, backend hosting, frontend hosting, database, CI/CD role

## Context

`infra/` currently contains only `CLAUDE.md` and `research/` — no CDK code exists. Three accepted ADRs describe what needs to be provisioned but nothing has been built yet:

- [ADR-0002](../architecture/decisions/0002-hosting-topology.md) — S3+CloudFront (frontend), ECS Fargate (backend)
- [ADR-0003](../architecture/decisions/0003-cicd-github-actions.md) — GitHub Actions, OIDC federation to IAM (no long-lived credentials)
- [ADR-0005](../architecture/decisions/0005-postgres-data-storage.md) — Postgres (RDS/Aurora)

This also closes a concrete gap: `backend/`'s Dockerfile currently exposes port `8080` as "a conventional default, not yet an ECS task-definition contract" (see `backend/CLAUDE.md`). Standing up the real ECS task definition turns that assumption into an actual contract. It also unblocks the backend's deferred DB driver work (`ADR-0005` is decided but nothing to connect to exists yet) and gives the frontend plan a real deploy target.

## Approach

CDK app in `infra/` (TypeScript), split into stacks:

1. **App init** — `cdk init` in `infra/`, TypeScript, matching the repo's existing TS convention for frontend/infra.
2. **NetworkStack** — VPC, 2 AZs, public + private subnets. Single NAT gateway to start (cost tradeoff at prototype stage over multi-AZ NAT redundancy — revisit if uptime requirements tighten).
3. **DatabaseStack** — RDS/Aurora Postgres per ADR-0005, in private subnets, credentials in Secrets Manager, security group scoped to only the backend service's security group.
4. **BackendStack** — ECR repo for the backend image; ECS Fargate service + task definition (container port `8080`, `GET /health` as the ALB health-check path — matches the existing backend scaffold exactly); ALB; task role wired to read the DB secret from Secrets Manager.
5. **FrontendStack** — S3 bucket (private, origin access control) + CloudFront distribution per ADR-0002.
6. **CiCdStack** — GitHub OIDC identity provider + IAM deploy role scoped to this repo, per ADR-0003. Outputs the role ARN for use by future `.github/workflows/*` (not created in this plan — see Out of Scope).
7. **Outputs** — backend ALB URL, frontend CloudFront URL, ECR repo URI, surfaced via `cdk deploy` outputs for local dev and CI/CD use.
8. **Doc updates once deployed** — remove the "conventional default, not confirmed" caveat from `backend/Dockerfile` and `backend/CLAUDE.md` now that the ECS task def defines the port contract for real; fill in `docs/architecture/overview.md`'s Data Flow section with concrete URLs/ARNs if useful.

### Judgment calls to confirm before/at implementation start

- **Environments**: single environment for now (matches the product's prototype/pre-PMF stage), or dev+prod split from day one? Leaning single environment — revisit once there's a real reason to isolate (a second, protected deploy target).
- **NAT strategy**: single NAT gateway (cheaper, single point of failure) vs. one per AZ (more resilient, ~2x NAT cost) — leaning single NAT at this stage.
- **RDS vs. Aurora Serverless v2** for the Postgres instance — Serverless v2 scales to near-zero cost when idle, which may suit a pre-PMF, likely-low-traffic prototype better than a fixed-size RDS instance; standard RDS is simpler to reason about. Worth a quick research note if not obvious once pricing is checked.

## Out of scope (this plan)

- `.github/workflows/*` CI/CD pipeline files — a natural follow-up once `CiCdStack`'s OIDC role exists; separate plan.
- OAuth app registration / secrets for [ADR-0006](../architecture/decisions/0006-oauth-and-api-key-auth.md) — follow-up once the backend actually implements auth.
- Multi-environment (dev/staging/prod) promotion pipeline — only relevant if the single-environment judgment call above changes.

## Progress Log

- 2026-08-23: Plan created.
