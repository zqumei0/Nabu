---
status: accepted
date: 2026-07-23
---

# ADR-0001: Use Go for the backend service

## Context

Nabu's backend language was undecided among Go, Rust, and Java. See [`../../../research/2026-07-23-backend-language-go-vs-rust-vs-java.md`](../../../research/2026-07-23-backend-language-go-vs-rust-vs-java.md) for the full comparison.

Relevant constraints: a small team leaning heavily on AI-agent-driven implementation, a preference for simple deployment alongside CDK-managed infra, and no current requirement for Rust's performance ceiling or Java's depth of enterprise libraries.

## Decision

Use Go for the backend service.

## Consequences

- Fast onboarding and simple deployment: small static binaries, simple containers, good cold-start behavior if any path ever runs on Lambda.
- Ecosystem alignment with the rest of the cloud-native tooling world (Docker, Kubernetes, Terraform providers), and a first-class AWS SDK.
- Best fit among the three candidates for agent-driven development specifically — Go's narrow, consistent idiom set produces fewer wasted iterations than Rust's borrow-checker friction.
- Trade-offs accepted: more verbose error handling than exception-based languages; a weaker type system than Rust (no compile-time memory/thread-safety guarantees, so nil-pointer panics remain possible); a smaller "batteries included" library ecosystem than Java's, meaning more custom glue code for things Java/Spring would provide off the shelf.
- Follow-up work: scaffold `backend/` (module layout, web framework choice, initial `go.mod`), flesh out `backend/CLAUDE.md` with concrete conventions once code exists, and keep Go-specific entries in the root `.gitignore` current.
