---
status: accepted
date: 2026-07-25
---

# ADR-0003: CI/CD via GitHub Actions

## Context

The repo already lives on GitHub. A CI/CD approach was needed for build/test/deploy across `infra/`, `frontend/`, and `backend/`.

## Decision

Use GitHub Actions for CI/CD.

## Consequences

- Lives alongside the code, simplest to wire up, large ecosystem of existing actions to draw from.
- Deploys to AWS will need an auth mechanism (e.g. OIDC federation to an IAM role) rather than long-lived credentials in Actions secrets.
- Revisit if deeper AWS-native pipeline integration (CodePipeline/CodeBuild) becomes necessary — not expected at this stage.
