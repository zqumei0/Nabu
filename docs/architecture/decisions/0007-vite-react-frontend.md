---
status: accepted
date: 2026-08-23
---

# ADR-0007: Use Vite + React SPA for the frontend

## Context

Nabu's frontend is a dashboard-heavy web app (ticket lists, filters, vulnerability views) for developers, sitting entirely behind auth with no public/SEO-relevant pages expected. Hosting is already decided as static S3+CloudFront ([ADR-0002](0002-hosting-topology.md)). See [`../../../research/2026-07-25-frontend-framework.md`](../../../research/2026-07-25-frontend-framework.md) for the full comparison against Next.js.

## Decision

Build the frontend as a plain React SPA scaffolded with Vite (React Router for routing).

## Consequences

- Pure static build output fits the S3+CloudFront hosting decision directly, with no workarounds (Next.js's SSR/API-route features would either need a Node server, contradicting static hosting, or a constrained static-export mode that gives up most of its value).
- Faster local dev iteration, simpler mental model — no server components/SSR concerns to reason about.
- Standard, well-understood pattern for authenticated dashboard/admin-style apps specifically, which is what Nabu's frontend is.
- Trade-off accepted: smaller "batteries included" surface than Next.js — routing (React Router) and data fetching (e.g. TanStack Query) are separate libraries to assemble rather than framework defaults. Both choices still need to be made when the frontend is actually scaffolded.
- No SSR/SEO story if public-facing pages (e.g. marketing/content) are ever needed — would require a separate solution at that point, likely Next.js for that surface specifically rather than replacing the dashboard SPA.
- Follow-up work: scaffold `frontend/` (Vite + React + TypeScript init, router choice, data-fetching library choice), flesh out `frontend/CLAUDE.md` and `frontend/docs/design.md` with concrete conventions once code exists — mirroring the backend scaffold done under [ADR-0001](0001-go-for-backend-language.md).
