---
topic: Backend language selection — Go vs. Rust vs. Java
status: resolved
date: 2026-07-23
related_adr: ../docs/architecture/decisions/0001-go-for-backend-language.md
---

# Backend Language: Go vs. Rust vs. Java

## Question

Which language should Nabu's backend service be built in? Candidates under consideration: Go, Rust, Java. See the open item tracked in [`../docs/architecture/overview.md`](../docs/architecture/overview.md).

## Findings

Quick-reference comparison:

| Dimension | Go | Rust | Java |
|---|---|---|---|
| Raw performance | Good | Best (no GC) | Good (GC, but mature collectors) |
| Memory/thread safety | GC, runtime panics possible | Compile-time guaranteed (borrow checker) | GC, runtime exceptions possible |
| Concurrency model | Goroutines/channels — simple, effective | `async`/`Tokio` — powerful, more complex | Threads; virtual threads (Loom, Java 21+) now lightweight |
| Learning curve | Low | High | Medium |
| Compile/iteration speed | Fast | Slower, borrow-checker friction | Medium |
| Ecosystem maturity for web/API services | Strong (Gin, Echo, gRPC, first-class AWS SDK) | Growing but younger (Axum, Actix-web) | Very mature (Spring Boot, Micronaut, Quarkus) |
| Deployment footprint | Small static binary, fast cold start | Small static binary, fast cold start | Heavier JVM footprint; native-image (GraalVM) closes this but adds build complexity |
| Hiring pool | Large, growing | Smallest of the three | Largest, most established |
| Alignment with rest of stack | Same language as much of the cloud-native/infra tooling ecosystem (Docker, k8s, Terraform); CDK here is TypeScript | No particular overlap with the rest of this repo | No particular overlap with the rest of this repo |
| Agent-driven development fit | Small surface area, "one way to do it" idioms — fewer footguns, agents tend to produce correct code in fewer iterations | Borrow checker causes more compile-fail/retry cycles for agent-generated code, even when logic is sound | Verbose but predictable; large stdlib/framework surface can lead agents toward inconsistent patterns across a codebase |

## Options Considered

### Go

**Pros**
- Simple language with a small surface area — fast onboarding, consistent idioms ("one way to do it")
- Goroutines/channels make concurrent request handling straightforward
- Fast compiles, single static binary — simple containers, fast cold starts (relevant if anything runs on Lambda)
- Mature web/API ecosystem (Gin, Echo, gRPC) and first-class AWS SDK support
- Same language family as most cloud-native tooling (Docker, Kubernetes, Terraform providers) — useful if the team ever needs to read/patch adjacent tooling
- Because of its small, consistent idiom set, AI agents tend to generate correct, working code in fewer iterations than in Rust — directly relevant given this repo is being built for heavy agent involvement

**Cons**
- Verbose error handling (`if err != nil` boilerplate) throughout
- Weaker type system than Rust — generics are relatively new (1.18+) and less expressive; no algebraic data types
- Nil pointer panics still possible — GC-backed, not compile-time memory/thread-safety guarantees
- Less raw performance than Rust for CPU-bound or extremely latency-sensitive work

### Rust

**Pros**
- Best raw performance of the three, no GC — predictable low latency
- Compile-time memory and thread safety (ownership/borrow checker) eliminates whole bug classes (data races, use-after-free, null derefs)
- Expressive type system (traits, enums/algebraic data types, exhaustive pattern matching) catches logic errors at compile time
- Small, efficient binaries — good for containers and Lambda cold-start-sensitive paths
- Best choice if the backend or agent-service ends up doing genuinely performance- or cost-critical work at scale

**Cons**
- Steepest learning curve — borrow-checker friction slows iteration, especially for less-experienced contributors
- Slowest to iterate with an AI agent in the loop: agent-generated Rust more frequently fails to compile on the borrow checker even when the logic is correct, meaning more fix-and-retry cycles per change
- Longest compile times as the codebase grows
- Smallest hiring pool of the three for production experience
- Async ecosystem, while much improved, still has more moving parts (runtime choice, async trait ergonomics) than Go's concurrency model

### Java

**Pros**
- Most mature ecosystem by far — Spring Boot/Micronaut/Quarkus, and libraries for virtually every backend need (ORMs, messaging, security, observability) with less custom code required
- Largest, most established hiring pool
- Battle-tested for large, long-running services; excellent profiling/monitoring tooling (JFR, APM integrations)
- Virtual threads (Project Loom, Java 21+) now give lightweight concurrency comparable to goroutines, closing an old gap with Go
- Strong static typing with mature IDE/refactoring support

**Cons**
- Heavier memory footprint and slower cold starts than Go/Rust; GraalVM native-image mitigates this but adds real build complexity
- More verbose/boilerplate-prone than Go, though modern Java (records, etc.) has narrowed this
- Larger framework surface (esp. Spring) can lead an AI agent toward inconsistent patterns across a codebase without strong conventions enforced via CLAUDE.md
- GC pauses still possible under memory pressure, though modern collectors (ZGC, Shenandoah) are strong

## Recommendation

**Decided: Go.** It best matches this repo's actual constraints — a small team leaning on AI agents for a large share of implementation, a preference for simple deployment (small static binaries fit both containers and CDK-managed infra cleanly), and no stated requirement for Rust's performance ceiling. Its narrow, idiomatic surface area is also the best fit for agent-driven development specifically: fewer ways to write something "wrong," and fewer wasted iterations on compiler friction compared to Rust.

Recorded as [ADR-0001](../docs/architecture/decisions/0001-go-for-backend-language.md); `docs/architecture/overview.md`'s Open Decisions section has been updated to reflect this.
