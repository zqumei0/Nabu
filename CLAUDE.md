# Nabu

Monorepo for the Nabu website: infra (CDK), frontend, backend, and an agent-facing product component. Backend is Go with an initial scaffold in place (see [ADR-0001](docs/architecture/decisions/0001-go-for-backend-language.md)); frontend and infra are not yet scaffolded.

## Where to look

- [`docs/README.md`](docs/README.md) — documentation map (architecture, domain knowledge, ADRs, plans)
- [`docs/plans/README.md`](docs/plans/README.md) — active/completed implementation plans and their progress
- [`docs/architecture/overview.md`](docs/architecture/overview.md) — system design, service boundaries, open decisions
- [`research/README.md`](research/README.md) — cross-cutting research on open topics
- `infra/CLAUDE.md` — infra (CDK) conventions
- `frontend/CLAUDE.md` — frontend conventions
- `backend/CLAUDE.md` — backend conventions

Each service directory owns its own docs. Check the service's `CLAUDE.md` before working in it.

## Planning new work

Use the `/prd` skill (`.claude/skills/prd/`) to scope a new plan — it carries a conversation to a `docs/plans/` plan doc plus a milestones/task-breakdown doc, following the same process used to build the frontend scaffold plan.

## Testing

Target 80% code coverage across all packages (frontend, backend, infra). Enforce via each language's native coverage tooling (e.g. `go test -cover` for backend, Vitest's `@vitest/coverage-v8` for frontend) rather than a separate cross-language tool. New packages should wire up coverage measurement as part of their initial scaffold, not as a later retrofit.
