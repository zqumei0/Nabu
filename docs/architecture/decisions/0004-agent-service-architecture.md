---
status: accepted
date: 2026-08-23
---

# ADR-0004: Split agent-service architecture; Claude Agent SDK on direct Anthropic API

## Context

Nabu's agent-facing component needs to support both a customer-facing chat/assistant (open-ended, conversational) and backend automation (triaging incoming scan results, auto-creating/updating tickets). See [`../../../research/2026-07-25-agent-service-architecture.md`](../../../research/2026-07-25-agent-service-architecture.md) for the full comparison.

Two separate axes were in play: (1) whether chat and automation live in one unified agent service or are split, and (2) how Claude models are hosted/run, independent of (1).

## Decision

- **Split**: a dedicated chat service (TypeScript, Claude Agent SDK) handles the customer-facing assistant; backend automation (triage, dedupe, ticket creation/update from scan results) is embedded directly in the Go backend, calling the Anthropic API directly for any LLM-assisted steps rather than via the Agent SDK (no official Go SDK exists).
- **Model hosting**: Claude Agent SDK + direct Anthropic API, self-hosted on Nabu's own AWS compute (same ECS Fargate pattern as the backend, per [ADR-0002](0002-hosting-topology.md)) — not Bedrock-hosted models or Bedrock AgentCore Runtime.

## Consequences

- Automation lives next to the data it acts on: ticket creation/update is a normal in-process function call and a single DB transaction, with no network hop or partial-failure window against a separate chat service.
- Automation can start as simple, direct Anthropic API calls (or non-LLM heuristics) for narrowly-scoped tasks like severity classification or dedup — no agent-loop complexity needed for the currently-scoped automation.
- Chat is free to use the full Agent SDK's tool-orchestration and context management for its genuinely open-ended, tool-rich conversational surface.
- Failure isolation: automation only depends on the backend (already a hard dependency); a chat-service outage doesn't block scan-result ingestion, and vice versa.
- Trade-off accepted: any tool logic needed by both sides (e.g. "look up ticket") is implemented twice — once as TS tool definitions for chat, once as Go functions for automation — and must be kept in sync by hand.
- Trade-off accepted: no official Agent SDK for Go means future growth toward more open-ended, multi-step automation has to be hand-rolled rather than inherited from the SDK.
- Direct Anthropic API gives fastest iteration and no feature lag behind Bedrock during the prototype stage, at the cost of a separate vendor/billing relationship outside AWS (the rest of the stack is otherwise fully AWS-native).
- **Revisit split vs. unified** if automation grows into something more open-ended and tool-heavy — at that point the duplication cost starts to outweigh the data-locality benefit, and migrating automation into the unified service (or at least sharing tool definitions) becomes worth it.
- **Revisit model hosting** toward Bedrock (model-hosting or full AgentCore Runtime) once there's a concrete compliance or vendor-consolidation driver — plausible given Nabu is itself a security product.
- Not a driver for this decision, but noted for later: AG-UI (transport) + A2UI (declarative rich-UI JSON) are candidate protocols for the chat service's frontend-facing interface once that surface is built out (see [`agentic-design.md`](../agentic-design.md)).
