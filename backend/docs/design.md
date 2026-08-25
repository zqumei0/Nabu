# Backend Design

> Depends on [data model design](../../docs/architecture/data-model.md); auth model decided in [ADR-0006](../../docs/architecture/decisions/0006-oauth-and-api-key-auth.md).

## Package / Module Structure

Flat layout, no `cmd/` subdir — one binary, so `main.go` sits at the module root. `internal/` is used for everything else since nothing needs to be importable outside this module yet.

```
backend/
  main.go              entrypoint: wires config, logging, server together, handles graceful shutdown
  internal/
    config/             env-var based config loading (PORT, LOG_LEVEL)
    logging/             slog.Logger construction (JSON handler, configurable level)
    server/               http.Server setup, routing, middleware, handlers
```

Package-by-feature (e.g. `internal/ticket/`, `internal/vulnerability/`) is the intended shape once real domain logic lands — not a layered `domain/`/`usecase/`/`repository/` split, which fights Go's package model. See `backend/CLAUDE.md` for the reasoning.

## API Surface

Endpoints, request/response shapes, auth touchpoints.

- `GET /health` — liveness check, returns `200 {"status":"ok"}`. No auth. Real endpoints (tickets, vulnerabilities, orgs, users) are still unbuilt, pending `data-model.md` being fleshed out beyond its current placeholder; auth middleware (OAuth/OIDC + API keys, [ADR-0006](../../docs/architecture/decisions/0006-oauth-and-api-key-auth.md)) is decided but not yet implemented.

## Error Handling Conventions

- Wrap errors with `%w` (via `fmt.Errorf`) to preserve the chain; avoid swallowing errors silently.
- No panics in the request path — handlers return/write an error response instead of panicking.
- No centralized error → HTTP-status mapping exists yet since there are no real endpoints beyond `/health`; add one (e.g. a small `apperror` package with a `Status() int` convention) once the first real handler needs to distinguish 4xx from 5xx.

## Observability / Logging

- Structured JSON logging via stdlib `log/slog`, written to stdout. Level configurable via `LOG_LEVEL` (default `info`).
- A logging middleware (`internal/server/middleware.go`) logs method, path, status, and duration for every request.
- Metrics/tracing: not yet set up — revisit once there's a hosting target (ECS Fargate, per ADR-0002) to wire into.
