---
status: accepted
date: 2026-08-23
---

# ADR-0006: OAuth/OIDC for human users, scoped API keys for machine integrations

## Context

Nabu needs to authenticate both human dashboard users (developers) and machine integrations (scanners, CI pipelines pushing vulnerability results). These two client types have different needs: humans expect (and trust) "sign in with GitHub" over another password; machine clients are headless and need long-lived-but-revocable, scriptable credentials. See [`../../../research/2026-07-25-auth-integration-model.md`](../../../research/2026-07-25-auth-integration-model.md) for the full comparison.

## Decision

Use both: OAuth/OIDC (GitHub as the first provider) for human dashboard users, and scoped API keys for scanner/CI machine integrations.

## Consequences

- Matches the standard pattern used by comparable developer-facing security/ticketing tools (GitHub, Snyk) — familiar to the target audience.
- Clean separation of concerns: human session security (OAuth/OIDC) and machine credential management (scoped, rotatable API keys) are solved with the tool suited to each, rather than forcing one mechanism to cover both.
- API keys can be scoped per-integration and revoked independently without touching human auth.
- Trade-off accepted: two systems to build and maintain instead of one, including a real key-management UX (create/rotate/revoke, scoping) for API keys.
- Follow-up work: this unblocks `backend/docs/design.md`'s API Surface section and the auth middleware currently listed as deferred in `backend/CLAUDE.md`. GitHub OAuth is the natural first provider given the developer audience and the already-existing GitHub-based CI/CD ([ADR-0003](0003-cicd-github-actions.md)).
