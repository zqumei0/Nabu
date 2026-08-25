---
topic: Frontend framework — Next.js vs. plain React SPA (Vite)
status: resolved
date: 2026-07-25
related_adr: ../docs/architecture/decisions/0007-vite-react-frontend.md
---

# Frontend Framework: Next.js vs. Plain React SPA (Vite)

## Question

Nabu's frontend is a dashboard-heavy web app (ticket lists, filters, vulnerability views) for developers, sitting behind auth with no public/SEO-relevant pages expected. Should it be built with Next.js or a plain React SPA scaffolded with Vite?

## Findings

Next.js is the more widely adopted React meta-framework overall (SSR/SSG, large ecosystem, heavy production use), but its main advantages — SSR, SEO, static generation — mainly benefit public-facing content. Vite has effectively replaced Create React App (officially deprecated) as the standard tool for client-only SPAs, and a plain Vite + React Router SPA is a very common pattern specifically for authenticated, dashboard-style internal/admin tools like this one.

A second, more concrete consideration: hosting is already decided (ADR-0002) as static S3+CloudFront for the frontend. A plain SPA build is just static files — a perfect fit. Next.js's headline features (SSR, API routes) need either a Node server or a constrained "static export" mode that gives up most of those features anyway, so choosing Next.js here would mean either working against the existing hosting decision or not using the parts of Next.js that justify picking it over Vite in the first place.

## Options Considered

### Next.js

**Pros**
- Broadest ecosystem and hiring pool among React frameworks.
- Built-in routing, data-fetching conventions, and (if ever needed) API routes/BFF layer.
- Better positioned if public/marketing pages or SEO needs get added later alongside the dashboard.

**Cons**
- Its main differentiators (SSR/SSG, API routes) don't fit an authenticated-only dashboard with no SEO need.
- Doesn't cleanly fit the already-decided static S3+CloudFront hosting (ADR-0002) without either running a Node server (contradicting "static hosting") or using static-export mode, which gives up most of the framework's value.

### Vite + React SPA

**Pros**
- Pure static build output — fits the S3+CloudFront hosting decision directly, no workarounds.
- Faster local dev iteration, simpler mental model (no server components/SSR concerns to reason about).
- Standard, well-understood pattern for authenticated dashboard/admin-style apps specifically.

**Cons**
- No SSR/SEO story if public-facing pages are ever needed — would require a separate solution at that point.
- Smaller "batteries included" surface — routing (React Router) and data fetching (e.g. TanStack Query) are separate libraries to assemble rather than framework defaults.

## Recommendation

**Vite + React SPA**. Next.js is more broadly adopted in general, but its advantages don't apply to this specific app — an authenticated, no-SEO-needed dashboard — and choosing it would mean fighting the hosting decision already made in ADR-0002. Revisit if a public-facing marketing/content surface gets added later; that would be a real reason to introduce Next.js (likely for that surface specifically, not necessarily replacing the dashboard SPA).
