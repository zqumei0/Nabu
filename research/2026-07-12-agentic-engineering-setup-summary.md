---
topic: Initial repo structure & documentation conventions for Nabu
status: resolved
date: 2026-07-12
related_adr:
---

# Agentic Engineering Setup — Session Summary

## Question

Nabu started as a completely empty repo (no commits). What documentation, planning, and research conventions should it use so the codebase is easy — and safe — for AI coding agents (Claude Code and others) to work in as it grows?

## Findings

**Project shape (as stated, largely still open):** a monorepo for a website — CDK infra, TypeScript frontend, backend language undecided (Go, Rust, or Java), plus an agent-facing product component (customer-facing chat and/or backend automation — not yet scoped).

**Initial recommendations discussed** (not yet acted on beyond docs):
- Skip JS-monorepo tooling (Nx/Turborepo) since the backend candidates (Go/Rust/Java) sit outside that ecosystem; use a root `justfile`/`Makefile` exposing uniform verbs (`build`, `test`, `deploy`) per package instead, so agents have one predictable entry point regardless of language.
- Root `CLAUDE.md` stays thin; each package gets its own `CLAUDE.md` to keep agent context small and package-scoped.
- Consider a `PreToolUse` hook requiring confirmation on `/infra` edits, since CDK changes have real AWS blast radius.
- For the agent-as-product piece: default to a small dedicated TypeScript service using the Claude Agent SDK (none of Go/Rust/Java have an official Agent SDK) rather than hand-rolling a tool-use loop against the raw Messages API inside the backend.

## Options Considered

- **Plan status tracking** — frontmatter (`status: active`) vs. moving files between `active/`/`completed/` folders. Chose frontmatter: it's a one-line edit in the same commit as a progress update, survives renames-free (no broken links), and grep is an exact, agent-friendly operation — a folder location is easy to let go stale since nothing about opening the file contradicts it.
- **Plan overview at scale** — one monolithic tracking file vs. per-plan files. A single file causes merge conflicts, unbounded growth (agents pay to read all history to check one plan), and blurred git blame. Landed on a **hybrid**: one lightweight index/dashboard (`docs/plans/README.md`, a status table) plus one file per plan carrying the real content and frontmatter.
- **ADRs** — include now vs. defer. Included the folder + template (`docs/architecture/decisions/`) so decisions get durable rationale once made, but wrote no actual ADRs yet since the big calls (backend language, agent-product shape) are still unresolved — writing ADRs mid-flux would just be churn.
- **Service docs location** — colocated in each service directory vs. centralized under `docs/services/`. Chose colocated, so an agent working in `/infra` finds `/infra/CLAUDE.md` and its docs without leaving the directory.
- **Research template sharing** — one shared `research/TEMPLATE.md` at root vs. a copy per service. Chose shared, to avoid the template drifting between locations.
- **Research status tracking** — light frontmatter (`status: open|resolved`, `related_adr`) vs. free-form notes. Chose light frontmatter for grep-friendliness and to make visible when a research topic fed into an actual ADR.

## Recommendation / Outcome

Structure created this session (documentation only — no code/tooling scaffolding):

```
CLAUDE.md                                    # root, thin, points into docs/ and research/

docs/
  README.md
  architecture/
    overview.md                              # service boundaries, data flow, Open Decisions
    decisions/TEMPLATE.md                    # ADR format (MADR-lite), none written yet
  knowledge/
    product-vision.md                        # placeholder
    domain-glossary.md                       # placeholder
  plans/
    README.md                                # index/dashboard table
    TEMPLATE.md                              # frontmatter: status/created/updated

research/
  README.md
  TEMPLATE.md                                # frontmatter: topic/status/date/related_adr

infra/    CLAUDE.md, research/README.md
frontend/ CLAUDE.md, research/README.md
backend/  CLAUDE.md, research/README.md
```

## Open items

- **Backend language** — Go vs. Rust vs. Java, undecided. Tracked in `docs/architecture/overview.md`.
- **Agent-product shape** — chat, backend automation, or both — undecided.
- **Agent-service architecture** — leaning toward a separate TS service (Claude Agent SDK), not finalized.
- **Actual scaffolding** — justfile, package manifests, CDK app, backend project — not yet created; this session was documentation structure only.

Once the backend language and agent-product shape are decided, write them up as ADRs in `docs/architecture/decisions/` and update `docs/architecture/overview.md`'s Open Decisions section accordingly.
