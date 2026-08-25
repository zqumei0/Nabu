---
title: Retrofit 80% test coverage into the backend scaffold
status: proposed
created: 2026-08-24
updated: 2026-08-24
---

# Plan: Retrofit 80% test coverage into the backend scaffold

## Context

Root `CLAUDE.md` now sets an 80% code coverage target across all packages, added while planning the frontend scaffold (see [`2026-08-23-frontend-scaffold.md`](2026-08-23-frontend-scaffold.md)). The backend scaffold was built before this standard existed — it has two tests today (`internal/config/config_test.go`, `internal/server/health_test.go`) but no coverage measurement configured and no verified coverage percentage. The user confirmed this retrofit is a deliberate follow-up, not bundled into the frontend plan.

## Approach

1. Add coverage measurement to the existing test workflow: `go test ./... -cover`, and `go test ./... -coverprofile=coverage.out` + `go tool cover -func=coverage.out` for a per-function breakdown. Add a `coverage` target to `backend/Makefile`.
2. Run it against the current scaffold to get a real baseline number (not yet measured).
3. Fill any gaps to reach 80% across `internal/config`, `internal/logging`, `internal/server`, and `main.go` — likely needs: a `logging` package test (currently untested), a `main.go`-level test or refactor to make its logic testable (e.g. extracting the signal-handling/shutdown flow into a testable function rather than leaving it inline in `func main()`), and edge-case tests for `server.go`/`middleware.go` beyond the current single health-handler test.
4. Document the coverage command in `backend/CLAUDE.md`'s "Running locally" section.
5. Decide whether to enforce the threshold in CI once `.github/workflows/*` exists (out of scope until that CI plan exists — note the intent here so it isn't lost).

## Out of scope

- Writing the actual `.github/workflows/*` CI pipeline — separate, not-yet-created plan; this just prepares the local tooling/commands that pipeline would eventually call.

## Progress Log

- 2026-08-24: Plan created as a follow-up to the frontend scaffold plan's coverage-standard discussion.
