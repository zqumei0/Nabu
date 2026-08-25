---
name: prd
description: Carry a conversation with the user to scope a plan for a feature/initiative (PRD-style), get it explicitly approved, then write the plan doc plus a companion milestones/task-breakdown doc into docs/plans/. Use when the user wants to plan new work before implementation — e.g. "/prd frontend scaffold", "/prd auth middleware", "let's PRD the CI pipeline".
argument-hint: <topic or feature to plan>
---

# /prd — Plan + Milestones/Task Breakdown

Produces exactly what this repo's `docs/plans/` convention expects: a plan file with `status: proposed`, and — once approved — a milestone/task breakdown detailed enough to execute without re-deriving context. This mirrors how the frontend-scaffold plan (`docs/plans/2026-08-23-frontend-scaffold.md` + `...-tasks.md`) was actually built; read those two files as the reference example if unsure what "done" looks like for any step below.

This skill's job ends once the plan + task breakdown are written and linked. It does not implement anything — implementation follows `docs/plans/README.md`'s **Execution** section separately.

## Do not use Plan Mode's file-only restriction for this

If Claude Code's Plan Mode auto-activates on a phrase like "let's plan X," exit it (`ExitPlanMode`) as soon as the initial direction is captured. This skill needs to write several real repo files as it goes (plan doc, tasks doc, `docs/plans/README.md`'s index, sometimes a research doc) — Plan Mode's single-file restriction actively fights that workflow. There's no need for the ephemeral session plan file at all here; the deliverable is the real `docs/plans/` artifact.

## Step 1 — Determine the topic

Use `$ARGUMENTS` if given. If empty or vague, ask the user what they want planned before doing anything else.

## Step 2 — Ground the plan in what already exists

Before drafting anything, check whether this topic is already decided, in flight, or blocked:

- `docs/architecture/overview.md` and `docs/architecture/decisions/` — is there already an ADR that settles part of this? Don't re-litigate a resolved decision; build on it and cite it.
- `research/README.md` and relevant research docs — is there open (unresolved) research this plan is blocked on? If so, either resolve it as a judgment call in Step 3, or say explicitly that a research doc needs to be written first (and offer to write it — see the package-manager research doc precedent) before the plan can be finalized.
- `docs/plans/README.md`'s index and `TEMPLATE.md` — is there already a plan for this, or an adjacent one this should link to/depend on (the way the frontend and infra plans cross-reference each other's deployment dependency)?
- The target service's `CLAUDE.md` and `docs/design.md` (if the work is service-scoped) — existing conventions to follow, not reinvent.

For unfamiliar or large-scope areas, use Explore agents to gather this context rather than guessing, the same way plan-mode's Phase 1 would.

## Step 3 — Draft the plan conversationally

Write toward this shape (matches `docs/plans/TEMPLATE.md` plus the extensions this repo's plans have converged on):

- **Context** — why this work, what prompted it, the intended outcome. Cite ADRs/research it builds on.
- **Decisions (confirmed with user)** — concrete technical choices, each with a one-line reason.
- **Target layout / approach** — concrete enough to execute from (file paths, not vague prose).

The critical discipline: **surface genuine judgment calls via `AskUserQuestion` instead of silently deciding.** A judgment call is a real tradeoff with no existing ADR or repo convention settling it (router choice, styling approach, directory layout, package manager — the pattern from the backend and frontend scaffolds). For each, present a recommended option with its reasoning plus the real alternatives, not a false binary. Don't bundle more than ~4 questions in one batch. If the user pushes back or asks for deeper analysis on any of them (as happened with the package-manager choice, which spun out into its own research doc), follow that thread to completion before returning to finalize the plan — don't force closure prematurely.

Iterate until the user **explicitly** confirms the direction. Silence or moving on to a different question is not approval.

## Step 4 — Once the plan direction is confirmed, write the plan file

`docs/plans/YYYY-MM-DD-<topic-slug>.md`, frontmatter `status: proposed`, `created`/`updated` today. Include the sections from Step 3 plus:

- **Out of scope** — what this plan deliberately does not cover, and why (usually: blocked on another undecided/unimplemented thing — say which).
- **Verification** — the actual commands/manual steps that prove the finished work works end-to-end.
- **Progress Log** — seed with a "Plan created" entry.

## Step 5 — Add the Milestones & Task Breakdown

In the same plan file, add a `## Milestones & Task Breakdown` section:

- Group tasks into milestones **ordered by dependency**, not by category for its own sake — each milestone should be a coherent, checkable chunk (e.g. Scaffold & Tooling → Shared Foundations → Features/Screens → Verification → Documentation, adapted to what's actually being built).
- Every task is a markdown checkbox tagged with an ID: `**[M<milestone>-<n>]**`.
- Size tasks to one meaningfully-testable unit of work each (roughly: one file, or one tightly-coupled file+test pair) — not per-line (too granular to track) and not "build the whole feature" (too coarse to verify).
- Link to the companion tasks doc (Step 6) right under the section heading.

## Step 6 — Create the companion tasks doc

`docs/plans/YYYY-MM-DD-<topic-slug>-tasks.md`. One card per task ID, in milestone order, each with exactly these five fields:

- **Motivation** — why this task exists, what it solves. Never "because the plan says so" — the actual underlying reason (e.g. "X screens both need this lookup, so it's shared rather than duplicated").
- **Assumptions** — pre-conditions taken as given (what must already be true/built for this task's description to make sense).
- **Description** — what to actually build, concrete enough to execute without re-reading the whole plan.
- **Acceptance Criteria** — how to know it's done. Prefer a command that can actually be run over a vague "works correctly."
- **Dependencies** — other task IDs that must complete first (cross-milestone references are normal and expected — a Step 5 milestone boundary doesn't mean tasks in it are independent of specific earlier tasks).

Cross-link both files: the plan's checklist items reference task IDs; the tasks doc's header links back to the plan.

## Step 7 — Register the plan

Add a row to `docs/plans/README.md`'s Index table (`status: proposed`, today's date for both Created/Updated). If this plan's discussion produced a repo-wide standard or convention (the way the 80% coverage target became a root `CLAUDE.md` addition rather than staying buried in one plan) — ask the user whether it should be recorded there too, don't assume it's plan-local.

## Stop here

Report back a summary of the plan + milestone/task counts and the file paths. Do not start executing tasks — that's a separate, explicit next step for the user to request.
