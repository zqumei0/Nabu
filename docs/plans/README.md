# Plans

Implementation plans for Nabu, tracked in-repo so they persist across sessions and are visible to any collaborator or agent.

## Lifecycle

Each plan is its own file (start from `TEMPLATE.md`) with a `status` field in its frontmatter:

- `proposed` — written, not yet started
- `active` — in progress
- `completed` — done
- `abandoned` — dropped, kept for record

**When you create a plan or change its status, update the table below in the same commit.**

## Execution

For plans with a task breakdown (milestones + per-task cards, e.g. motivation/assumptions/description/acceptance criteria/dependencies), whoever executes it — human or agent — should:

- Work tasks in dependency order; before starting a task, confirm the tasks it depends on are actually checked off, not just assumed.
- Verify each task against its own stated acceptance criteria before checking it off — run the actual command/test, don't just assert it's done.
- Flip `status` to `active` when work starts and `completed` when the last task is checked off; keep the Index table in sync at both transitions.
- Add a Progress Log entry at milestone boundaries, not per-task — but if a task's real implementation ends up diverging from what its card describes, update that card too, so the plan documents what was actually built, not just what was intended.
- Flag genuine judgment calls the plan didn't anticipate to the user rather than deciding silently; routine execution of an already-detailed task doesn't need a check-in.

## Index

| Plan | Status | Created | Updated |
|------|--------|---------|---------|
| [Infra scaffold](2026-08-23-infra-scaffold.md) | proposed | 2026-08-23 | 2026-08-23 |
| [Frontend scaffold](2026-08-23-frontend-scaffold.md) | active | 2026-08-23 | 2026-08-24 |
| [Backend coverage retrofit](2026-08-24-backend-coverage-retrofit.md) | proposed | 2026-08-24 | 2026-08-24 |
