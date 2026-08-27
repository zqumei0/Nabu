---
title: Stand up frontend (Vite + React SPA) with UI/UX mocks and a mocked backend API layer
status: active
created: 2026-08-23
updated: 2026-08-24
---

# Plan: Stand up frontend (Vite + React SPA) with UI/UX mocks and a mocked backend API layer

## Context

`frontend/` currently contains only `CLAUDE.md` and a skeleton `docs/design.md` — no code exists. [ADR-0007](../architecture/decisions/0007-vite-react-frontend.md) decided the framework (Vite + React SPA). The backend only exposes `GET /health` today — real ticket/vulnerability/organization/user endpoints are blocked on `docs/architecture/data-model.md` being fleshed out and the backend's DB/auth work (both decided in [ADR-0005](../architecture/decisions/0005-postgres-data-storage.md)/[ADR-0006](../architecture/decisions/0006-oauth-and-api-key-auth.md), neither implemented yet).

To avoid the frontend being blocked on backend progress, this plan scaffolds the SPA against a **mocked API layer** that mirrors the eventual real API shape — every call the frontend needs to make to the backend gets a typed stub returning fixture data instead, so screens are real and demoable now, and swapping in live data later is a small, contained change rather than a rewrite.

## Decisions (confirmed with user)

- **Package manager: npm.** Already installed, zero setup, simplest GitHub Actions integration. Full comparison in [`frontend/research/2026-08-24-package-manager.md`](../../frontend/research/2026-08-24-package-manager.md) — Bun/Yarn Berry revisited only if a JS workspace with `infra/` materializes or install time becomes a measured problem.
- **Styling: Tailwind CSS** (v4, via `@tailwindcss/vite`). Fastest iteration across 5 data-heavy screens without CSS Modules' naming overhead or committing to a component library's design system before Nabu's visual identity is decided.
- **Mock fixtures: plain typed stub functions**, not MSW. Enough to drive TanStack Query's loading/error/success states; avoids service-worker setup for data that's explicitly provisional and will be discarded once real endpoints exist.
- **React Router: plain component mode** (`BrowserRouter`/`Routes`/`Route`), not the v6.4+ loader/action data-router API. Keeps data fetching entirely inside TanStack Query via `useQuery`, so the later mock→real swap only touches the API layer, never routing.
- **Directory layout: feature-based (domain-driven)**, not type-based. Unlike the backend scaffold (which had zero domain logic and got a flat layout for that reason), this plan already names concrete domain areas — tickets, vulnerabilities, auth, settings — each with real screens and data needs. `src/features/<area>/` groups everything about one area together; `src/components/` and `src/api/` stay for genuinely shared/generic code (badges, states, the mock/real swap point, cross-feature types, org/user lookups with no dedicated screen of their own).
- **Test coverage: 80% target** (lines/functions/branches/statements), matching the repo-wide standard now recorded in root `CLAUDE.md`. Enforced via Vitest's `@vitest/coverage-v8` provider with thresholds set in `vite.config.ts`'s `test.coverage` block — `npm run test -- --coverage` fails the build if any metric drops below 80%. This means most non-trivial files need a test, not just the riskiest seams (see expanded Testing section below).

## Target layout

```
frontend/
  src/
    main.tsx                        # QueryClientProvider > BrowserRouter > AuthProvider > App
    App.tsx                         # <Routes> definition
    index.css                       # @import "tailwindcss";
    features/
      tickets/
        DashboardPage.tsx            # ticket list + filters (route: /)
        DashboardPage.test.tsx
        TicketDetailPage.tsx         # route: /tickets/:ticketId
        TicketDetailPage.test.tsx
        TicketList.tsx
        TicketList.test.tsx
        TicketFilters.tsx
        TicketFilters.test.tsx
        api.ts                        # listTickets, getTicket
        api.test.ts
      vulnerabilities/
        VulnerabilityListPage.tsx      # route: /vulnerabilities
        VulnerabilityListPage.test.tsx
        VulnerabilityDetailPage.tsx    # route: /vulnerabilities/:vulnId
        VulnerabilityDetailPage.test.tsx
        api.ts                         # listVulnerabilities, getVulnerability
        api.test.ts
      auth/
        AuthContext.tsx                 # mock auth: hardcoded fake user
        AuthContext.test.tsx
        useAuth.ts
        LoginPage.tsx                   # route: /login
        LoginPage.test.tsx
      settings/
        SettingsPage.tsx                 # route: /settings, placeholder
        SettingsPage.test.tsx
    components/                          # shared/generic UI only
      ProtectedRoute.tsx
      ProtectedRoute.test.tsx
      AppShell.tsx                        # top nav / layout wrapper
      AppShell.test.tsx
      SeverityBadge.tsx
      SeverityBadge.test.tsx
      StatusBadge.tsx
      StatusBadge.test.tsx
      LoadingState.tsx
      EmptyState.tsx
      ErrorState.tsx
    api/                                  # cross-feature: swap point, shared types, org/user lookups
      client.ts                            # mock/real swap point (VITE_USE_MOCK_API)
      client.test.ts
      types.ts                             # Ticket/Vulnerability/Org/User — provisional, flagged
      organizations.ts                      # getOrganization, listOrganizations
      organizations.test.ts
      users.ts                              # getCurrentUser, listUsers
      users.test.ts
      fixtures/
        tickets.ts
        vulnerabilities.ts
        organizations.ts
        users.ts
    lib/
      queryClient.ts
    setupTests.ts
  .env.example                     # VITE_USE_MOCK_API=true
  index.html
  package.json
  tsconfig.json / tsconfig.app.json / tsconfig.node.json
  vite.config.ts                    # includes test.coverage thresholds (80% lines/functions/branches/statements)
  CLAUDE.md          (update)
  docs/design.md     (update)
```

`organizations.ts`/`users.ts` stay under shared `api/` rather than their own `features/` folders — they're cross-cutting lookups (ticket assignee names, org display name) with no dedicated screen of their own; `SettingsPage` (in `features/settings/`) imports from them directly.

## File-by-file plan

**Scaffold**
```
cd frontend
npm create vite@latest . -- --template react-ts --force
npm install
npm install react-router-dom @tanstack/react-query
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```
`npm install -D @vitest/coverage-v8` additionally, for coverage. `vite.config.ts` gets `@tailwindcss/vite` added to `plugins`, plus a `test` block: `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/setupTests.ts'`, and `coverage: { provider: 'v8', thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 } }`. Keep the template's generated `tsconfig.app.json` (strict mode) unmodified.

**Routing** (`src/App.tsx`)
```
/login                           LoginPage                (public)
/                                 DashboardPage             (protected) — ticket list
/tickets/:ticketId                TicketDetailPage          (protected)
/vulnerabilities                  VulnerabilityListPage     (protected)
/vulnerabilities/:vulnId          VulnerabilityDetailPage   (protected)
/settings                         SettingsPage              (protected, placeholder)
*                                  redirect → /
```
`ProtectedRoute` reads `useAuth()`; no user → `<Navigate to="/login" />`; else renders `<AppShell><Outlet/></AppShell>`. Provider order in `main.tsx`: `QueryClientProvider` → `BrowserRouter` → `AuthProvider` → `App`.

**Mock API layer** (`src/api/` for shared pieces, `src/features/*/api.ts` for feature-owned resources)
- `api/client.ts` — `const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'` (default true) plus an `apiDelay<T>(data, ms=300)` helper.
- `api/types.ts` — `Severity`, `TicketStatus`, `User`, `Organization`, `Vulnerability`, `Ticket`, `TicketFilters` (with `minSeverity`/`assigneeId` driving the "severity ≥ high, assigned to me" filter). Header comment: **PROVISIONAL — `docs/architecture/data-model.md` has no fields defined yet; reconcile once it is.**
- `features/tickets/api.ts` (`listTickets(filters)`, `getTicket(id)`), `features/vulnerabilities/api.ts` (`listVulnerabilities`, `getVulnerability`), `api/organizations.ts` (`getOrganization`, `listOrganizations`), `api/users.ts` (`getCurrentUser`, `listUsers`) — each checks `USE_MOCK_API`, returns `apiDelay(...)` over fixture data, else throws `Not implemented — see backend/docs/design.md#api-surface`.
- `api/fixtures/` — hand-written arrays: ~2 orgs, ~3 users (one matching the mock current user), ~10–15 tickets/vulnerabilities spanning all severities/statuses, with at least one ticket assigned to the mock user at `high`/`critical` severity to exercise the key dashboard filter.

**Mock auth** (`src/features/auth/AuthContext.tsx`) — header comment flags it as temporary pending real OAuth (ADR-0006). Hardcoded `FAKE_USER`; `AuthProvider` holds `user` in `useState`; `login()` sets it, `logout()` clears it; `LoginPage` renders one "Log in as Dev User" button.

**Screens** (each with loading/empty/error states via `LoadingState`/`EmptyState`/`ErrorState`, driven by `useQuery`'s status):
- **LoginPage** — centered card, app name placeholder, single mock-login button. No async state.
- **DashboardPage** — `AppShell` nav (app name, Dashboard/Vulnerabilities/Settings links, user name + logout) + `TicketFilters` (status select, min-severity select, "assigned to me" checkbox, pre-checked) + `TicketList` (title, `StatusBadge`, `SeverityBadge`, assignee, updated date; rows link to `/tickets/:id`).
- **TicketDetailPage** — title, `StatusBadge`, metadata, linked vulnerability card (second `useQuery` keyed on `vulnerabilityId`), status-transition select (mock-only, in-memory). Not-found state if the id doesn't match any fixture.
- **VulnerabilityListPage** — severity-filterable list, same states, rows link to detail.
- **VulnerabilityDetailPage** — title, `SeverityBadge`, CVE if present, description, discovered date, linked tickets list.
- **SettingsPage** — read-only org name + current user info, "Not yet implemented" note. No forms/mutations.

**Testing** (Vitest + React Testing Library + `@vitest/coverage-v8`) — sized to hit the repo-wide 80% coverage target (lines/functions/branches/statements), not just the riskiest seams. One test file per source file with real logic; trivial re-export/type-only files are excluded from the coverage report via `coverage.exclude` rather than padded with no-op tests:

- `features/tickets/api.test.ts` — `listTickets` filters correctly by status/severity/assignee; `getTicket` found/not-found.
- `features/tickets/DashboardPage.test.tsx` — loading → ticket rows; empty state when filters match nothing; error state + retry.
- `features/tickets/TicketDetailPage.test.tsx` — renders ticket + linked vulnerability; not-found state; status-transition select updates local state.
- `features/tickets/TicketList.test.tsx` — renders rows from given tickets, correct badges per row.
- `features/tickets/TicketFilters.test.tsx` — filter changes call the provided change handler with the right values.
- `features/vulnerabilities/api.test.ts` — `listVulnerabilities` filters by severity; `getVulnerability` found/not-found.
- `features/vulnerabilities/VulnerabilityListPage.test.tsx` — loading/empty/error/success states.
- `features/vulnerabilities/VulnerabilityDetailPage.test.tsx` — renders detail + linked tickets list.
- `features/auth/AuthContext.test.tsx` — `login()`/`logout()` update `user` correctly; `useAuth()` outside a provider throws.
- `features/auth/LoginPage.test.tsx` — clicking the mock-login button logs in and navigates to `/`.
- `features/settings/SettingsPage.test.tsx` — renders org/user info from mock data.
- `components/ProtectedRoute.test.tsx` — redirects to `/login` when logged out, renders children when logged in.
- `components/AppShell.test.tsx` — renders nav links and the logged-in user's name.
- `components/SeverityBadge.test.tsx` / `StatusBadge.test.tsx` — correct label/color per enum value, including all `Severity`/`TicketStatus` variants (this is where branch coverage is easiest to under-hit if skipped).
- `api/client.test.ts` — `apiDelay` resolves with the given data; `USE_MOCK_API` reads the env flag correctly.
- `api/organizations.test.ts` / `api/users.test.ts` — mock-mode lookups return expected fixture data, not-found cases return `undefined`.

`LoadingState`/`EmptyState`/`ErrorState` are presentational-only (props straight to JSX, no branching) — covered incidentally through the screen tests above that render them, rather than duplicated in isolated tests.

**`.gitignore` additions** (root, under the existing Node/TypeScript section): `.vite/`, `*.local`.

## Docs to update

- **`frontend/CLAUDE.md`** — mirror `backend/CLAUDE.md`'s structure: intro (scaffolded, ADR-0007), Layout, Routing, Data fetching, Mock API/mock auth (flagged temporary), Running locally (`npm install`/`npm run dev`/`npm run test`/`npm run build`), and a **Deferred — decided, not yet implemented** section: real backend integration, real OAuth (ADR-0006), deployment (blocked on infra's `FrontendStack`), CI workflow.
- **`frontend/docs/design.md`** — fill in all five sections: Routing/Pages (route table + per-screen states above), Component Architecture (feature-based layout rationale — domain areas already known, unlike the backend's blank-slate case — plus `AppShell`/`ProtectedRoute` composition and plain-component-mode routing), State Management (TanStack Query for server state, `useState` for local/filter state, `AuthContext` for the one global mock-auth value), API Consumption (the `api/client.ts` swap point, provisional-types callout), Build/Tooling (Vite, TS strict, Tailwind v4, Vitest+RTL+coverage-v8, npm, 80% coverage threshold).

## Out of scope (this plan)

- Real backend integration — blocked on the backend's data model, DB, and auth implementation work.
- Real OAuth flow — blocked on [ADR-0006](../architecture/decisions/0006-oauth-and-api-key-auth.md) being implemented in the backend.
- Deployment — depends on the infra plan's `FrontendStack` (S3+CloudFront) existing; see [`2026-08-23-infra-scaffold.md`](2026-08-23-infra-scaffold.md).

## Milestones & Task Breakdown

Ordered by dependency — each milestone should be fully checked off (including its tests, per the Testing section above) before the next starts. Check items off in this file as work completes; flip `status` in the frontmatter to `active` when M1 starts and `completed` when M5 finishes, updating `docs/plans/README.md`'s index in the same commit per this repo's plan convention.

Each task below has a full description (motivation, assumptions, description, acceptance criteria, dependencies) in the companion doc: [`2026-08-23-frontend-scaffold-tasks.md`](2026-08-23-frontend-scaffold-tasks.md).

### M1 — Scaffold & Tooling

- [x] **[M1-1]** `npm create vite@latest . -- --template react-ts --force` in `frontend/`, then `npm install`
- [x] **[M1-2]** Install runtime deps: `react-router-dom`, `@tanstack/react-query`
- [x] **[M1-3]** Install dev deps: `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- [x] **[M1-4]** Wire Tailwind: `@tailwindcss/vite` plugin in `vite.config.ts`, `@import "tailwindcss";` in `src/index.css`
- [x] **[M1-5]** Add `test` block to `vite.config.ts` (`environment: 'jsdom'`, `globals: true`, `setupFiles`, `coverage.thresholds` at 80%)
- [x] **[M1-6]** `src/setupTests.ts` (imports `@testing-library/jest-dom`)
- [x] **[M1-7]** `.env.example` (`VITE_USE_MOCK_API=true`)
- [x] **[M1-8]** Add `.vite/` and `*.local` to root `.gitignore`
- [x] Verify: `npm run dev` serves the default template; `npx tsc --noEmit` passes clean

### M2 — Shared Foundations (data layer, auth, shared UI)

- [x] **[M2-1]** `src/api/types.ts` (provisional types, PROVISIONAL header comment)
- [x] **[M2-2]** `src/api/fixtures/{tickets,vulnerabilities,organizations,users}.ts`
- [x] **[M2-3]** `src/api/client.ts` + `client.test.ts`
- [x] **[M2-4]** `src/api/organizations.ts` + `organizations.test.ts`
- [x] **[M2-5]** `src/api/users.ts` + `users.test.ts`
- [x] **[M2-6]** `src/lib/queryClient.ts`
- [x] **[M2-7]** `src/features/auth/AuthContext.tsx` + `AuthContext.test.tsx`, `useAuth.ts`
- [x] **[M2-8]** `src/components/ProtectedRoute.tsx` + `ProtectedRoute.test.tsx`
- [x] **[M2-9]** `src/components/AppShell.tsx` + `AppShell.test.tsx`
- [x] **[M2-10]** `src/components/SeverityBadge.tsx` + `SeverityBadge.test.tsx`
- [x] **[M2-11]** `src/components/StatusBadge.tsx` + `StatusBadge.test.tsx`
- [x] **[M2-12]** `src/components/LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx`
- [x] **[M2-13]** `src/main.tsx` (`QueryClientProvider` → `BrowserRouter` → `AuthProvider` → `App`)

### M3 — Screens & Routing

- [ ] **[M3-1]** `src/App.tsx` (route table, `ProtectedRoute` wrapper, `*` redirect)
- [ ] **[M3-2]** `src/features/auth/LoginPage.tsx` + `LoginPage.test.tsx`
- [ ] **[M3-3]** `src/features/tickets/api.ts` + `api.test.ts` (`listTickets`, `getTicket`)
- [ ] **[M3-4]** `src/features/tickets/TicketFilters.tsx` + `TicketFilters.test.tsx`
- [ ] **[M3-5]** `src/features/tickets/TicketList.tsx` + `TicketList.test.tsx`
- [ ] **[M3-6]** `src/features/tickets/DashboardPage.tsx` + `DashboardPage.test.tsx`
- [ ] **[M3-7]** `src/features/tickets/TicketDetailPage.tsx` + `TicketDetailPage.test.tsx`
- [ ] **[M3-8]** `src/features/vulnerabilities/api.ts` + `api.test.ts` (`listVulnerabilities`, `getVulnerability`)
- [ ] **[M3-9]** `src/features/vulnerabilities/VulnerabilityListPage.tsx` + `VulnerabilityListPage.test.tsx`
- [ ] **[M3-10]** `src/features/vulnerabilities/VulnerabilityDetailPage.tsx` + `VulnerabilityDetailPage.test.tsx`
- [ ] **[M3-11]** `src/features/settings/SettingsPage.tsx` + `SettingsPage.test.tsx`
- [ ] Verify: manual route walkthrough (`/login` → `/` → ticket detail → vulnerabilities → detail → settings → logout)

### M4 — Coverage Verification & Build

- [ ] **[M4-1]** `npm run test -- --coverage` — all four metrics (lines/functions/branches/statements) ≥ 80%; fill any gaps found
- [ ] **[M4-2]** `npm run build` succeeds (tsc + vite build)
- [ ] **[M4-3]** `npx tsc --noEmit` reports no errors

### M5 — Documentation

- [ ] **[M5-1]** Update `frontend/CLAUDE.md` (intro, Layout, Routing, Data fetching, Mock API/mock auth, Running locally, Deferred section)
- [ ] **[M5-2]** Update `frontend/docs/design.md` (Routing/Pages, Component Architecture, State Management, API Consumption, Build/Tooling)
- [ ] **[M5-3]** Flip this plan's `status` to `completed`, update `updated` date and `docs/plans/README.md`'s index row

## Verification

- `cd frontend && npm run build` succeeds (tsc + vite build).
- `cd frontend && npm run test -- --coverage` passes with all four coverage metrics (lines/functions/branches/statements) ≥ 80%.
- `cd frontend && npm run dev` starts the Vite dev server; manually walk: `/login` → log in → `/` shows filtered ticket list → click a ticket → detail page shows linked vulnerability → `/vulnerabilities` list → detail → `/settings` placeholder → logout → redirected to `/login`.
- `npx tsc --noEmit` reports no type errors.

## Follow-ups (tracked separately, not this plan)

- Retrofit `go test -cover` tooling + additional tests into the existing backend scaffold to bring it up to the same 80% coverage standard (backend was built before this standard was set; user confirmed this is a separate follow-up, not bundled into this plan).

## Progress Log

- 2026-08-23: Plan created.
- 2026-08-24: Package-manager research completed ([`frontend/research/2026-08-24-package-manager.md`](../../frontend/research/2026-08-24-package-manager.md), npm chosen). All four implementation judgment calls (package manager, styling, fixtures, router mode) confirmed with user. Plan fleshed out to file-by-file detail.
- 2026-08-24: Switched to a feature-based directory layout and expanded the plan to an 80% coverage target (repo-wide standard, recorded in root `CLAUDE.md`), per user feedback. Backend coverage retrofit noted as a separate follow-up.
- 2026-08-24: Added milestone/task breakdown (M1 Scaffold & Tooling, M2 Shared Foundations, M3 Screens & Routing, M4 Coverage Verification & Build, M5 Documentation) for progress tracking.
- 2026-08-24: Added per-task descriptions (motivation, assumptions, description, acceptance criteria, dependencies) for all 38 tasks in [`2026-08-23-frontend-scaffold-tasks.md`](2026-08-23-frontend-scaffold-tasks.md); checklist items above tagged with task IDs (e.g. `M1-1`) to cross-reference.
- 2026-08-24: Status flipped to `active`, M1 (Scaffold & Tooling) implemented and verified — one commit per task, per user request. `create-vite`'s actual flag is `--overwrite` (not `--force`) and it wipes the whole target directory first; recovered the repo's existing `frontend/` docs via `git restore` (see M1-1's task card for the gotcha). All M1 acceptance criteria verified: `tsc --noEmit` clean, `npm run build` succeeds, `npm run test -- --coverage` exits 0, dev server serves 200.
- 2026-08-27: M2 (Shared Foundations) implemented and verified — one commit per task. Executed M2-9 (AppShell) before M2-8 (ProtectedRoute) since ProtectedRoute renders AppShell, despite the lower task number — dependency order within a milestone isn't strictly linear by ID. Two deviations from the task cards, both recorded there: M2-5 added `getUser(id)` beyond `getCurrentUser`/`listUsers` (needed by M3's ticket/assignee display); M2-8's test drives auth state via direct `AuthContext.Provider` injection instead of an effect-based login helper, which raced against `<Navigate>`'s own redirect effect and was flaky. 24/24 tests passing, `tsc --noEmit` clean, `npm run build` succeeds.
