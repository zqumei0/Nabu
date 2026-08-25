---
title: Stand up frontend (Vite + React SPA) with UI/UX mocks and a mocked backend API layer
status: proposed
created: 2026-08-23
updated: 2026-08-23
---

# Plan: Stand up frontend (Vite + React SPA) with UI/UX mocks and a mocked backend API layer

## Context

`frontend/` currently contains only `CLAUDE.md` and a skeleton `docs/design.md` — no code exists. [ADR-0007](../architecture/decisions/0007-vite-react-frontend.md) decided the framework (Vite + React SPA). The backend only exposes `GET /health` today — real ticket/vulnerability/organization/user endpoints are blocked on `docs/architecture/data-model.md` being fleshed out and the backend's DB/auth work (both decided in [ADR-0005](../architecture/decisions/0005-postgres-data-storage.md)/[ADR-0006](../architecture/decisions/0006-oauth-and-api-key-auth.md), neither implemented yet).

To avoid the frontend being blocked on backend progress, this plan scaffolds the SPA against a **mocked API layer** that mirrors the eventual real API shape — every call the frontend needs to make to the backend gets a typed stub returning fixture data instead, so screens are real and demoable now, and swapping in live data later is a small, contained change rather than a rewrite.

## Approach

1. **Scaffold**: Vite + React + TypeScript init in `frontend/`; React Router for routing; TanStack Query for data fetching (both were flagged in [research](../../research/2026-07-25-frontend-framework.md) as "separate libraries to assemble" — no framework default here).

2. **Core screens** (driven by `product-vision.md` + `data-model.md`'s named entities: tickets, vulnerabilities, organizations, users), sketched as low-fidelity UI/UX mocks — layout, key elements, and loading/empty/error states — written into `frontend/docs/design.md`'s "Routing / Pages" section as each is built:
   - **Login** — mocked (see Auth below), not a real OAuth flow yet.
   - **Dashboard / ticket list** — filterable by status, severity, assignee; this is the primary query shape called out in the [data-storage research](../../research/2026-07-25-data-storage.md) ("open tickets for org X, severity ≥ high, assigned to me").
   - **Ticket detail** — linked vulnerability, status transitions.
   - **Vulnerability list / detail**.
   - **Org / user settings** — placeholder only; not a focus of this pass.

3. **Mock API layer** (`frontend/src/api/`) — one typed function per intended endpoint (`listTickets`, `getTicket`, `listVulnerabilities`, `getVulnerability`, ...), request/response shapes inferred from `data-model.md`'s named entities (that doc has no fields defined yet — shapes here are provisional and will need reconciling once it's fleshed out; flag this explicitly in the code). Each stub returns static fixture data with a simulated network delay via `setTimeout`/`Promise`, behind a single swap point (e.g. one factory function or an `USE_MOCK_API` env flag) so the mock implementations can be replaced with real `fetch` calls later without touching calling code or component logic.

4. **Mock auth** — since [ADR-0006](../architecture/decisions/0006-oauth-and-api-key-auth.md) isn't implemented in the backend yet, stub a fake "logged in user" for local dev (no real GitHub OAuth redirect) so protected screens are reachable. Document this clearly as temporary in `frontend/CLAUDE.md`.

5. **Component architecture / styling** — pick a lightweight approach (see judgment call below); document the decision in `frontend/docs/design.md`'s "Component Architecture" section once chosen.

6. **Docs** — fill in `frontend/CLAUDE.md` (how to run/test/build, mock-vs-real API convention, env vars) and the remaining `frontend/docs/design.md` sections (State Management, API Consumption, Build/Tooling) as each is decided/built — mirroring how `backend/CLAUDE.md`/`backend/docs/design.md` were filled in during the backend scaffold.

7. **Tests** — component/unit tests for the mock data layer and key components, establishing the pattern before real complexity (or real backend integration) arrives.

### Judgment calls to confirm before/at implementation start

- **Styling approach** — Tailwind vs. CSS Modules vs. a component library (e.g. shadcn/ui, MUI). No research doc or prior decision covers this; worth a quick confirm given it affects every screen going forward.
- **Fixture data source** — hand-written TypeScript fixtures vs. a tool like MSW (Mock Service Worker) that intercepts at the network layer instead of stubbing functions directly. MSW is closer to "real" (exercises actual fetch/loading states) but is more setup than plain stub functions; leaning toward plain stub functions for now given this is meant to be swapped out, not a long-lived testing tool.

## Out of scope (this plan)

- Real backend integration — blocked on the backend's data model, DB, and auth implementation work.
- Real OAuth flow — blocked on [ADR-0006](../architecture/decisions/0006-oauth-and-api-key-auth.md) being implemented in the backend.
- Deployment — depends on the infra plan's `FrontendStack` (S3+CloudFront) existing; see [`2026-08-23-infra-scaffold.md`](2026-08-23-infra-scaffold.md).

## Progress Log

- 2026-08-23: Plan created.
