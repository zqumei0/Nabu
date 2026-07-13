# Research

Cross-cutting / application-level research — exploratory investigation on open topics that aren't owned by a single service (e.g. "which agent architecture pattern"). Service-specific research lives in that service's own `research/` folder instead.

This is distinct from:
- [`../docs/architecture/decisions/`](../docs/architecture/decisions/) — ADRs, the final decision + rationale once a topic is settled
- [`../docs/plans/`](../docs/plans/) — implementation plans with progress tracking

## Convention

- Copy [`TEMPLATE.md`](TEMPLATE.md) to start a new research doc.
- Name it `YYYY-MM-DD-topic-slug.md`.
- Set `status: open` while investigating; flip to `resolved` once concluded.
- If the research leads to an actual decision, write an ADR in `docs/architecture/decisions/` and set `related_adr` in this doc's frontmatter to link back.
