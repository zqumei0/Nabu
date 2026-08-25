---
topic: Auth / integration model
status: resolved
date: 2026-07-25
related_adr: ../docs/architecture/decisions/0006-oauth-and-api-key-auth.md
---

# Auth / Integration Model

## Question

Nabu needs to authenticate both human users (developers using the dashboard) and machine integrations (scanners, CI pipelines pushing vulnerability results). What's the auth model — SSO/OAuth for humans plus API keys for integrations, SSO/OAuth only, API keys only, or something else?

## Findings

The two client types have genuinely different needs:

- **Human users** are developers, who generally expect (and are more likely to trust) "sign in with GitHub/Google" over yet another password to manage — especially for a B2B, org-based product where org membership needs to be verified.
- **Machine clients** (scanners, CI pipelines) are headless — interactive OAuth flows don't fit them well. They need long-lived-but-revocable, scriptable credentials: API keys (or a client-credentials grant, which is effectively the same shape with extra ceremony).
- This split — OAuth/OIDC for humans, scoped API keys for machine integrations — is the standard pattern used by comparable developer-facing security/ticketing tools (GitHub, Snyk, and similar).

## Options Considered

### Both: SSO/OAuth (humans) + API keys (integrations)

**Pros**
- Matches how developer-facing tools in this space typically work — familiar to the target audience.
- Clean separation of concerns: human session security (OAuth/OIDC) vs. machine credential management (scoped, rotatable API keys) are different problems, and this model solves each with the right tool.
- API keys can be scoped per-integration and revoked independently without touching human auth.

**Cons**
- Two systems to build and maintain instead of one.
- Needs a real key-management UX (create/rotate/revoke, scoping) to be done well, which is extra upfront work.

### SSO/OAuth only

**Pros**
- Single auth system, simpler to reason about.

**Cons**
- Poor fit for headless scanner/CI clients — would need a client-credentials grant at minimum, which is more complex to implement correctly than a simple API key and still needs the same key-management UX in practice.

### API keys only (including for human users)

**Pros**
- Simplest to build initially — one mechanism for everyone.

**Cons**
- Worse UX for human users (no "sign in with GitHub", manual key handling for people), unusual for a dashboard product.
- Doesn't scale well to a multi-user, org-based product — no natural session/identity model for humans, harder to reason about who-did-what for audit purposes.

## Recommendation

**Both**: OAuth/OIDC (GitHub as a natural first provider, given the developer audience) for human users, plus scoped API keys for scanner/CI integrations. This matches audience expectations and the actual shape of the two client types, at the cost of building two systems instead of one — a cost worth paying here rather than forcing machine clients through an interactive auth flow, or human users through raw API keys.
