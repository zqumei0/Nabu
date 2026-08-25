# Task Details: Frontend Scaffold

Companion to [`2026-08-23-frontend-scaffold.md`](2026-08-23-frontend-scaffold.md) — full description for every task in that plan's Milestones & Task Breakdown. Task IDs (`M1-1`, `M2-3`, ...) match the checklist items there; check items off in the main plan file, not here.

Each task: **Motivation** (why it exists / what it solves), **Assumptions** (pre-conditions taken as given), **Description** (what to actually build), **Acceptance Criteria** (how to know it's done), **Dependencies** (task IDs that must complete first).

---

## M1 — Scaffold & Tooling

### M1-1 — Init Vite scaffold

- **Motivation:** Nothing exists in `frontend/` beyond docs; [ADR-0007](../architecture/decisions/0007-vite-react-frontend.md) decided Vite+React SPA and explicitly calls out scaffolding as follow-up work. This is the root dependency for every other task in the plan.
- **Assumptions:** Node v26.5.1 / npm 11.17.0 available locally (confirmed during exploration); `frontend/` exists with only `CLAUDE.md`, `docs/`, `research/` — no code — so the Vite CLI needs `--force` to scaffold into a non-empty directory.
- **Description:** Run `npm create vite@latest . -- --template react-ts --force` inside `frontend/`, then `npm install`. Produces `package.json`, `tsconfig*.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `public/`.
- **Acceptance Criteria:** `frontend/package.json` exists with react/react-dom/vite/typescript deps; `npm run dev` serves the default Vite+React template; `npx tsc --noEmit` passes clean on the untouched template.
- **Dependencies:** None (first task).

### M1-2 — Install runtime dependencies

- **Motivation:** React Router and TanStack Query are the decided routing/data-fetching libraries (see plan Decisions), but aren't part of the Vite template.
- **Assumptions:** M1-1 complete.
- **Description:** `npm install react-router-dom @tanstack/react-query`.
- **Acceptance Criteria:** both packages appear in `package.json` `dependencies` (not `devDependencies`) and in `package-lock.json`; install runs clean with no peer-dependency errors.
- **Dependencies:** M1-1.

### M1-3 — Install dev dependencies

- **Motivation:** Tailwind (styling decision), Vitest + RTL + jsdom (testing), and `@vitest/coverage-v8` (80% coverage enforcement, repo-wide standard in root `CLAUDE.md`) are all needed before any component or test code is written.
- **Assumptions:** M1-1 complete.
- **Description:** `npm install -D tailwindcss @tailwindcss/vite vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`.
- **Acceptance Criteria:** all packages appear in `devDependencies`; no install errors.
- **Dependencies:** M1-1.

### M1-4 — Wire Tailwind CSS

- **Motivation:** The styling decision (Tailwind v4 via the Vite plugin) needs to be active before any component uses utility classes — otherwise every component written before this task would need retrofitting.
- **Assumptions:** M1-3 complete (`tailwindcss` + `@tailwindcss/vite` installed).
- **Description:** Add `@tailwindcss/vite` to the `plugins` array in `vite.config.ts`; add `@import "tailwindcss";` as the first line of `src/index.css`.
- **Acceptance Criteria:** a utility class (e.g. `className="text-red-500"`) visibly applies with the dev server running.
- **Dependencies:** M1-3.

### M1-5 — Configure Vitest + coverage thresholds

- **Motivation:** The 80% coverage target (plan Decisions, root `CLAUDE.md` standard) has to be enforced from the start, not bolted on after tests already exist — otherwise there's no signal during M2/M3 about whether coverage is on track.
- **Assumptions:** M1-3 complete (`vitest` + `@vitest/coverage-v8` installed).
- **Description:** Add a `test` block to `vite.config.ts`: `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/setupTests.ts'`, `coverage: { provider: 'v8', thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 } }`. Add a `"test": "vitest run"` script to `package.json`.
- **Acceptance Criteria:** `npm run test -- --coverage` runs (even with zero tests, executes and reports 0% rather than erroring on missing config).
- **Dependencies:** M1-3.

### M1-6 — Test setup file

- **Motivation:** React Testing Library's custom matchers (e.g. `toBeInTheDocument`) need `@testing-library/jest-dom` registered globally before any test file can use them.
- **Assumptions:** M1-5 complete (`setupFiles` path referenced in `vite.config.ts`).
- **Description:** Create `src/setupTests.ts` with `import '@testing-library/jest-dom';`.
- **Acceptance Criteria:** a throwaway test using `expect(el).toBeInTheDocument()` type-checks and runs without "matcher not found" errors.
- **Dependencies:** M1-5.

### M1-7 — Env example file

- **Motivation:** `VITE_USE_MOCK_API` is the single swap-point flag (plan Decisions / mock API layer) controlling mock vs. real backend calls; `.env.example` documents it for anyone setting the project up fresh, per Vite's env-file convention.
- **Assumptions:** M1-1 complete.
- **Description:** Create `frontend/.env.example` with `VITE_USE_MOCK_API=true`.
- **Acceptance Criteria:** file exists and is committed (not gitignored — only `*.local` env files are ignored, not `.env.example` itself).
- **Dependencies:** M1-1.

### M1-8 — Gitignore additions

- **Motivation:** Vite generates a `.vite/` cache directory and supports `*.local` env-file overrides (e.g. `.env.local`), neither of which the root `.gitignore`'s existing Node/TypeScript section covers (confirmed during exploration).
- **Assumptions:** None.
- **Description:** Add `.vite/` and `*.local` to the root `.gitignore`'s Node/TypeScript section.
- **Acceptance Criteria:** `git status` after running the dev server doesn't show `.vite/` as untracked.
- **Dependencies:** None — can happen any time before M1 is considered done; ordered last only for grouping.

---

## M2 — Shared Foundations

### M2-1 — Shared types (`api/types.ts`)

- **Motivation:** Every fixture, API stub, and component that renders ticket/vulnerability/org/user data needs a shared type contract; writing it first prevents each downstream file from inventing its own shape.
- **Assumptions:** M1 complete (TS project exists). `docs/architecture/data-model.md` has no fields defined yet — types here are necessarily invented, not derived from it.
- **Description:** Define `Severity`, `TicketStatus`, `User`, `Organization`, `Vulnerability`, `Ticket`, `TicketFilters` (with `minSeverity`/`assigneeId` fields to drive the "severity ≥ high, assigned to me" filter). Header comment: "PROVISIONAL — `docs/architecture/data-model.md` has no fields defined yet; reconcile once it is."
- **Acceptance Criteria:** file compiles under TS strict mode; every field referenced by later fixture/component tasks exists on the right type.
- **Dependencies:** M1-1.

### M2-2 — Fixture data (`api/fixtures/*`)

- **Motivation:** Every mock API function (M2-3–M2-5, M3-3, M3-8) needs data to return; centralizing it keeps fixtures consistent across features (e.g. a ticket's `orgId` must match a real fixture org).
- **Assumptions:** M2-1 complete (types exist to type the fixtures against).
- **Description:** Hand-write arrays in `api/fixtures/{tickets,vulnerabilities,organizations,users}.ts`: ~2 orgs, ~3 users (one matching the mock current user from M2-7), ~10–15 tickets/vulnerabilities spanning all severity/status values, with at least one ticket assigned to the mock user at `high`/`critical` severity.
- **Acceptance Criteria:** fixtures type-check against `api/types.ts`; at least one ticket exists that would appear under the Dashboard's default "assigned to me, severity ≥ high" filter (needed for M3-6/M4 to have a non-empty case to test).
- **Dependencies:** M2-1.

### M2-3 — API client swap point (`api/client.ts`)

- **Motivation:** This is the single seam the "keep responses mocked until backend is developed" requirement depends on — every resource module reads `USE_MOCK_API` from here instead of rolling its own check.
- **Assumptions:** Conceptually depends on M2-1/M2-2's fixture pattern, though this file itself has no direct import dependency on them.
- **Description:** Export `const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'` (default true) and `function apiDelay<T>(data: T, ms = 300): Promise<T>`.
- **Acceptance Criteria:** `client.test.ts` verifies `apiDelay` resolves with the given data after a delay, and `USE_MOCK_API` reflects the env var.
- **Dependencies:** M1-7 (env var must exist), M1-5 (test tooling).

### M2-4 — Organizations lookup API (`api/organizations.ts`)

- **Motivation:** `SettingsPage` (M3-11) and ticket/vulnerability detail views need org display names; this is a cross-feature lookup with no dedicated screen, so it lives in shared `api/` rather than a `features/` folder (per the plan's layout Decision).
- **Assumptions:** M2-2 (org fixtures), M2-3 (swap point) complete.
- **Description:** `getOrganization(id)`, `listOrganizations()` — mock-mode returns fixture data via `apiDelay`; real-mode throws `Not implemented — see backend/docs/design.md#api-surface`.
- **Acceptance Criteria:** `organizations.test.ts` covers found and not-found cases for `getOrganization`.
- **Dependencies:** M2-2, M2-3.

### M2-5 — Users lookup API (`api/users.ts`)

- **Motivation:** Ticket assignee names (`TicketList`, `TicketDetailPage`) and the current-user display (`AppShell`, `SettingsPage`) both need user lookups; same cross-feature reasoning as M2-4.
- **Assumptions:** M2-2 (user fixtures), M2-3 (swap point) complete.
- **Description:** `getCurrentUser()`, `listUsers()` — same mock/throw pattern as M2-4.
- **Acceptance Criteria:** `users.test.ts` covers `getCurrentUser` returning the fixture matching `AuthContext`'s `FAKE_USER` id.
- **Dependencies:** M2-2, M2-3.

### M2-6 — Query client setup (`lib/queryClient.ts`)

- **Motivation:** TanStack Query needs exactly one `QueryClient` instance shared app-wide via `QueryClientProvider`.
- **Assumptions:** M1-2 (TanStack Query installed).
- **Description:** `export const queryClient = new QueryClient();` — default options only, no custom retry/staleTime tuning needed for a mock-backed app.
- **Acceptance Criteria:** importable from `src/lib/queryClient` with no circular-import issues once wired into `main.tsx` (M2-13).
- **Dependencies:** M1-2.

### M2-7 — Mock auth context (`features/auth/AuthContext.tsx`, `useAuth.ts`)

- **Motivation:** [ADR-0006](../architecture/decisions/0006-oauth-and-api-key-auth.md) (OAuth/OIDC + API keys) isn't implemented in the backend yet; every protected route needs *some* notion of a logged-in user to be reachable and demoable today.
- **Assumptions:** The hardcoded `FAKE_USER` should be a valid `User` per `api/types.ts` and should match a fixture from M2-2/M2-5 for consistency.
- **Description:** `AuthContext` holds `user: User | null` in `useState`; `login()` sets it to a hardcoded `FAKE_USER`, `logout()` clears it. `useAuth()` hook reads the context. Header comment flags this as temporary, to be replaced once ADR-0006 is implemented.
- **Acceptance Criteria:** `AuthContext.test.tsx` verifies `login()`/`logout()` update `user` correctly and `useAuth()` throws when called outside a provider.
- **Dependencies:** M2-1 (`User` type), M2-5 (fixture consistency).

### M2-8 — Protected route guard (`components/ProtectedRoute.tsx`)

- **Motivation:** All 5 screens except Login are meant to sit behind auth (plan's routing table) — this is the single gating mechanism so no individual route needs its own auth check.
- **Assumptions:** M2-7 complete (`useAuth` available).
- **Description:** Reads `useAuth()`; if no user, `<Navigate to="/login" replace />`; else renders `<AppShell><Outlet /></AppShell>`.
- **Acceptance Criteria:** `ProtectedRoute.test.tsx` verifies redirect-when-logged-out and children-render-when-logged-in.
- **Dependencies:** M2-7, M2-9 (renders `AppShell`).

### M2-9 — App shell layout (`components/AppShell.tsx`)

- **Motivation:** Every protected screen shares the same nav (Dashboard/Vulnerabilities/Settings links, user name, logout) — building it once avoids duplicating nav markup across 5 screens.
- **Assumptions:** M2-7 complete (needs `useAuth()` for user name + logout).
- **Description:** Top nav with app name, links to `/`, `/vulnerabilities`, `/settings`, current user's name, and a logout button calling `logout()`.
- **Acceptance Criteria:** `AppShell.test.tsx` verifies nav links render and the logged-in user's name displays.
- **Dependencies:** M2-7.

### M2-10 — Severity badge (`components/SeverityBadge.tsx`)

- **Motivation:** Severity appears on tickets and vulnerabilities across 4 different screens (Dashboard, TicketDetail, VulnList, VulnDetail) — one shared component keeps the color mapping consistent.
- **Assumptions:** M2-1 complete (`Severity` type exists).
- **Description:** Color-coded badge: `critical`/`high` → red/orange, `medium` → yellow, `low` → gray, via a color map kept inline in the component (no separate design-tokens file, per the plan's prototype-stage styling approach).
- **Acceptance Criteria:** `SeverityBadge.test.tsx` covers all 4 `Severity` values rendering the correct label/color — the Testing section flags this as the easiest place to under-hit branch coverage if skipped.
- **Dependencies:** M2-1.

### M2-11 — Status badge (`components/StatusBadge.tsx`)

- **Motivation:** Same reasoning as M2-10, for `TicketStatus` (open/in_progress/resolved/closed) shown on Dashboard and TicketDetail.
- **Assumptions:** M2-1 complete.
- **Description:** Same pattern as `SeverityBadge`, one branch per `TicketStatus` value.
- **Acceptance Criteria:** `StatusBadge.test.tsx` covers all 4 `TicketStatus` values.
- **Dependencies:** M2-1.

### M2-12 — Loading/empty/error state components

- **Motivation:** Every screen needs consistent loading/empty/error UI driven by `useQuery`'s status — three tiny shared components avoid rebuilding this per screen.
- **Assumptions:** None beyond M1.
- **Description:** `LoadingState` (skeleton/spinner placeholder), `EmptyState` (message prop, e.g. "No tickets match these filters"), `ErrorState` (message + retry button, takes an `onRetry` callback for `useQuery`'s `refetch()`).
- **Acceptance Criteria:** components render their props correctly. Per the Testing section these are presentational-only and covered incidentally through the screen tests (M3) that render them — no isolated test files required to hit 80%, but confirm via the M4 coverage run that this holds in practice.
- **Dependencies:** M1-1.

### M2-13 — App entry point & provider composition (`main.tsx`)

- **Motivation:** This is where all of M2's providers (QueryClient, Router, Auth) actually get composed around the app — nothing in M3 can render correctly without this wiring.
- **Assumptions:** M2-6 (`queryClient`), M2-7 (`AuthProvider`) complete. `App.tsx` (M3-1) can be a forward reference — this file can be written before M3-1 exists, just won't run end-to-end until it does.
- **Description:** `<QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></QueryClientProvider>`, mounted via `ReactDOM.createRoot`.
- **Acceptance Criteria:** app boots without provider-order errors (e.g. "useAuth must be used within AuthProvider") once M3-1 exists.
- **Dependencies:** M2-6, M2-7.

---

## M3 — Screens & Routing

### M3-1 — Route table (`App.tsx`)

- **Motivation:** Defines the actual navigable structure of the app — every screen task after this needs a route to be reachable at all.
- **Assumptions:** M2-8 (`ProtectedRoute`), M2-13 (provider composition) complete or in progress.
- **Description:** `<Routes>` per the plan's routing table: `/login` (public), and `/`, `/tickets/:ticketId`, `/vulnerabilities`, `/vulnerabilities/:vulnId`, `/settings` nested under `<Route element={<ProtectedRoute />}>`; `*` redirects to `/`.
- **Acceptance Criteria:** navigating to each path (once its screen exists) renders the right component; an unknown path redirects to `/`; a protected path while logged out redirects to `/login`.
- **Dependencies:** M2-8.

### M3-2 — Login page (`features/auth/LoginPage.tsx`)

- **Motivation:** The only public entry point into the app — needed before any protected screen can be reached in a manual walkthrough.
- **Assumptions:** M2-7 (`useAuth`/`login()`) complete.
- **Description:** Centered card, app name placeholder, single "Log in as Dev User" button calling `login()` then navigating to `/`. No form fields, no real credentials, no async/loading state (synchronous mock).
- **Acceptance Criteria:** `LoginPage.test.tsx` verifies clicking the button calls `login()` and navigates to `/`.
- **Dependencies:** M2-7, M3-1.

### M3-3 — Tickets API module (`features/tickets/api.ts`)

- **Motivation:** `DashboardPage` and `TicketDetailPage` (M3-6, M3-7) both need ticket data; this is the feature-owned resource module per the layout Decision (tickets has its own screens, so its API lives with the feature, unlike orgs/users).
- **Assumptions:** M2-1 (types), M2-2 (fixtures), M2-3 (swap point) complete.
- **Description:** `listTickets(filters: TicketFilters)`, `getTicket(id: string)` — mock-mode filters the fixture array by status/severity/assignee, real-mode throws not-implemented.
- **Acceptance Criteria:** `api.test.ts` verifies `listTickets` filters correctly by each of status/severity/assignee independently and in combination; `getTicket` covers found and not-found.
- **Dependencies:** M2-1, M2-2, M2-3.

### M3-4 — Ticket filters component (`features/tickets/TicketFilters.tsx`)

- **Motivation:** Implements the key query shape called out in the data-storage research ("open tickets for org X, severity ≥ high, assigned to me") as actual UI.
- **Assumptions:** M2-1 (types for filter values).
- **Description:** Status `<select>`, min-severity `<select>`, "assigned to me" checkbox (pre-checked by default). Calls a provided change handler with an updated `TicketFilters` object.
- **Acceptance Criteria:** `TicketFilters.test.tsx` verifies each control change invokes the handler with the correct updated filter value.
- **Dependencies:** M2-1.

### M3-5 — Ticket list component (`features/tickets/TicketList.tsx`)

- **Motivation:** Shared rendering logic for a list of tickets — used by `DashboardPage` today, potentially reusable if a ticket list is needed elsewhere later (e.g. an org or vulnerability detail page).
- **Assumptions:** M2-10 (`SeverityBadge`), M2-11 (`StatusBadge`) complete.
- **Description:** Renders rows (title, `StatusBadge`, `SeverityBadge`, assignee name, updated date) for a given array of tickets; each row links to `/tickets/:id`.
- **Acceptance Criteria:** `TicketList.test.tsx` verifies rows render for given tickets with correct badges per row.
- **Dependencies:** M2-10, M2-11.

### M3-6 — Dashboard page (`features/tickets/DashboardPage.tsx`)

- **Motivation:** The primary screen — the "open tickets for org X, severity ≥ high, assigned to me" use case made real, and the first thing a logged-in user sees at `/`.
- **Assumptions:** M3-3 (tickets API), M3-4 (filters), M3-5 (list), M2-12 (state components) complete.
- **Description:** Composes `TicketFilters` + `useQuery(['tickets', filters], () => listTickets(filters))` + `TicketList`, with `LoadingState`/`EmptyState`/`ErrorState` (with retry via `refetch()`) per query status.
- **Acceptance Criteria:** `DashboardPage.test.tsx` verifies loading → ticket rows render; empty state shows when filters match nothing; error state + retry work.
- **Dependencies:** M3-3, M3-4, M3-5, M2-12.

### M3-7 — Ticket detail page (`features/tickets/TicketDetailPage.tsx`)

- **Motivation:** Lets a user drill into a single ticket and see its linked vulnerability — the second half of the core ticket workflow after the dashboard.
- **Assumptions:** M3-3 (tickets API), M3-8 (vulnerabilities API) complete.
- **Description:** `useQuery` for the ticket by the `:ticketId` param; second `useQuery` keyed on `ticket.vulnerabilityId` for the linked vulnerability card; a status-transition `<select>` that updates local state only (no persisted mutation — mock-only, flagged as such in the UI or a comment).
- **Acceptance Criteria:** `TicketDetailPage.test.tsx` verifies the ticket + linked vulnerability render, a not-found state shows for an unknown id, and the status-transition select updates local state.
- **Dependencies:** M3-3, M3-8.

### M3-8 — Vulnerabilities API module (`features/vulnerabilities/api.ts`)

- **Motivation:** Needed by both `TicketDetailPage` (linked vulnerability) and the vulnerability list/detail screens — mirrors M3-3's role for the vulnerabilities feature.
- **Assumptions:** M2-1, M2-2, M2-3 complete.
- **Description:** `listVulnerabilities(filters)`, `getVulnerability(id)` — same mock/throw pattern as tickets.
- **Acceptance Criteria:** `api.test.ts` verifies severity filtering and found/not-found for `getVulnerability`.
- **Dependencies:** M2-1, M2-2, M2-3.

### M3-9 — Vulnerability list page (`features/vulnerabilities/VulnerabilityListPage.tsx`)

- **Motivation:** Mirrors the Dashboard's list pattern for vulnerabilities, reachable from `AppShell`'s nav.
- **Assumptions:** M3-8 complete.
- **Description:** Severity-filterable list using `useQuery` + the same Loading/Empty/Error state pattern; rows link to `/vulnerabilities/:id`.
- **Acceptance Criteria:** `VulnerabilityListPage.test.tsx` covers loading/empty/error/success states.
- **Dependencies:** M3-8, M2-12.

### M3-10 — Vulnerability detail page (`features/vulnerabilities/VulnerabilityDetailPage.tsx`)

- **Motivation:** Completes the vulnerability workflow, including the reverse link back to tickets (which tickets reference this vulnerability).
- **Assumptions:** M3-8 (vulnerabilities API), M3-3 (tickets API, for the linked-tickets query) complete.
- **Description:** Title, `SeverityBadge`, CVE if present, description, discovered date, and a "Linked tickets" list (tickets whose `vulnerabilityId` matches this one).
- **Acceptance Criteria:** `VulnerabilityDetailPage.test.tsx` verifies the detail fields and linked-tickets list render correctly.
- **Dependencies:** M3-8, M3-3.

### M3-11 — Settings page (`features/settings/SettingsPage.tsx`)

- **Motivation:** Explicit placeholder screen per the plan's scope — establishes the route without inventing more provisional data shapes than needed for this pass.
- **Assumptions:** M2-4 (organizations API), M2-5 (users API) complete.
- **Description:** Read-only org name (via `getOrganization`) and current user info (via `getCurrentUser`), plus a "Not yet implemented" note. No forms, no mutations.
- **Acceptance Criteria:** `SettingsPage.test.tsx` verifies org/user info renders from mock data.
- **Dependencies:** M2-4, M2-5.

---

## M4 — Coverage Verification & Build

### M4-1 — Coverage verification

- **Motivation:** Enforces the repo-wide 80% coverage standard (root `CLAUDE.md`) as an actual gate, not just an aspiration — this is where gaps get caught before the plan is marked complete.
- **Assumptions:** M2 and M3 fully complete (all source + test files written).
- **Description:** Run `npm run test -- --coverage`; for any file/metric below 80%, add or extend tests until the threshold is met — the Testing section's per-file list is the expected floor, not necessarily sufficient on its own.
- **Acceptance Criteria:** `npm run test -- --coverage` exits 0 with all four metrics (lines, functions, branches, statements) ≥ 80% overall.
- **Dependencies:** All of M2, M3.

### M4-2 — Production build verification

- **Motivation:** Confirms the app actually builds into deployable static output — a prerequisite for the (separate) infra plan's `FrontendStack` deployment later.
- **Assumptions:** M3 complete.
- **Description:** Run `npm run build` (tsc + vite build).
- **Acceptance Criteria:** build succeeds with no errors, produces a `dist/` directory.
- **Dependencies:** M3 complete.

### M4-3 — Type-check verification

- **Motivation:** Catches type errors that `npm run build`'s bundling step might not surface as clearly as a dedicated type-check pass.
- **Assumptions:** M3 complete.
- **Description:** Run `npx tsc --noEmit`.
- **Acceptance Criteria:** zero type errors.
- **Dependencies:** M3 complete.

---

## M5 — Documentation

### M5-1 — Update `frontend/CLAUDE.md`

- **Motivation:** Mirrors the backend scaffold's documentation pattern — every convention decided in this plan (layout, routing, styling, mock API/auth, coverage) needs to be discoverable by the next person or agent working in `frontend/`, per this repo's "check the service's `CLAUDE.md` before working in it" convention.
- **Assumptions:** M1–M4 complete (conventions are final, not still in flux).
- **Description:** Replace "Not yet scaffolded" with real conventions: Layout (feature-based rationale), Routing, Data fetching, Mock API/mock auth (flagged temporary), Running locally commands, and a "Deferred — decided, not yet implemented" section (real backend integration, real OAuth, deployment, CI workflow).
- **Acceptance Criteria:** doc structure mirrors `backend/CLAUDE.md`'s sections; every command listed (`npm run dev`/`test`/`build`) actually works as documented.
- **Dependencies:** M1–M4.

### M5-2 — Update `frontend/docs/design.md`

- **Motivation:** Same rationale as M5-1, for the living-design-doc half of this repo's documentation split (`CLAUDE.md` = conventions/how-to, `design.md` = current shape of the system).
- **Assumptions:** M1–M4 complete.
- **Description:** Fill in all five sections: Routing/Pages, Component Architecture (feature-based layout rationale), State Management, API Consumption (swap-point + provisional-types callout), Build/Tooling (including the 80% coverage threshold).
- **Acceptance Criteria:** all five previously-empty section headers now have real content matching what was actually built (not just what was planned, in case anything changed during implementation).
- **Dependencies:** M1–M4.

### M5-3 — Close out plan status

- **Motivation:** Keeps `docs/plans/README.md`'s index accurate, per this repo's plan-lifecycle convention ("update the table below in the same commit").
- **Assumptions:** M5-1, M5-2 complete.
- **Description:** Flip `2026-08-23-frontend-scaffold.md`'s frontmatter `status` to `completed`, update its `updated` date, add a final Progress Log entry, update the corresponding row in `docs/plans/README.md`.
- **Acceptance Criteria:** `docs/plans/README.md`'s Frontend scaffold row shows status `completed` with today's date.
- **Dependencies:** M5-1, M5-2, M4 (all verification passed).
