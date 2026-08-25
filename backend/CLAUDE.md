# backend

Backend for Nabu, written in Go (see [ADR-0001](../docs/architecture/decisions/0001-go-for-backend-language.md)).

Service-specific documentation and conventions live in this file and in `backend/docs/` alongside it (see [`docs/design.md`](docs/design.md) for package structure, API surface, error handling, and observability). Open research topics live in [`research/README.md`](research/README.md).

## Layout

Flat, no `cmd/` subdir: `main.go` at the module root, `internal/config`, `internal/logging`, `internal/server`. See [`docs/design.md`](docs/design.md#package--module-structure) for the full rationale — package-by-feature (`internal/ticket/`, `internal/vulnerability/`) is the intended shape once real domain logic lands, not a layered domain/usecase/repository split.

## Router

Stdlib `net/http`, using Go 1.22+'s built-in method+path routing (`mux.HandleFunc("GET /health", ...)`). No third-party router — the built-in routing closes most of the historical gap (method routing, path params) that used to justify chi/gin/echo. Middleware is hand-rolled via `func(http.Handler) http.Handler`. Revisit only if the middleware stack grows substantially (auth, tracing, rate limiting).

## Running locally

```
go run .                # starts the server on :8080 (PORT env var to override)
go test ./...            # run tests
go build -o bin/api .     # or: make build / make run / make test
```

Env vars: `PORT` (default `8080`), `LOG_LEVEL` (default `info`).

## Error handling

Wrap errors with `%w`; no panics in the request path. See [`docs/design.md`](docs/design.md#error-handling-conventions).

## Deferred — decided, not yet implemented

- **DB driver / migrations** — Postgres decided ([ADR-0005](../docs/architecture/decisions/0005-postgres-data-storage.md)); driver (pgx/sqlc/`database/sql`) and migration tool (goose/atlas/golang-migrate) still to be chosen and wired in.
- **Auth middleware** — OAuth/OIDC (GitHub, humans) + scoped API keys (machine integrations) decided ([ADR-0006](../docs/architecture/decisions/0006-oauth-and-api-key-auth.md)); not yet implemented.
- **Backend automation** (triage, ticket creation/update from scan results) — embedded in this service per [ADR-0004](../docs/architecture/decisions/0004-agent-service-architecture.md), calling the Anthropic API directly; not yet implemented.
- **CI workflow** (`.github/workflows/*`) — not yet created; natural follow-up once this scaffold is in place (`go build`, `go vet`, `go test ./...`).
- **ECS task definition / container port contract** — no CDK/ECS stack exists in `infra/` yet. The Dockerfile currently exposes `8080` as a conventional default, not a confirmed contract.
- **Real endpoints** (tickets, vulnerabilities, orgs, users) — depend on `docs/architecture/data-model.md` being fleshed out beyond its current placeholder.
