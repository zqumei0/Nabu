# Agentic Design

> Architecture decided: split, see [ADR-0004](decisions/0004-agent-service-architecture.md). This document covers the chat service; backend automation conventions live in `backend/CLAUDE.md` and `backend/docs/design.md` instead. This doc's location may move into a dedicated chat-service directory once that's scaffolded.

## Chat Interface

UX flow — what users can ask/do via the customer-facing chat/assistant.

> Candidate protocol pair for rich (non-text) responses: **AG-UI** (transport connecting the frontend to the chat agent) + **A2UI** (declarative JSON format for agent-returned UI — cards, forms). See the [agent-service architecture research](../../research/2026-07-25-agent-service-architecture.md) for details. To be evaluated when this section gets fleshed out for real.

## Backend Automation

Triggers (e.g. scan-result ingestion) and the resulting actions (triage, ticket creation/update).

## Tool Surface

What tools/data the agent needs access to — likely reading/writing the [data model](data-model.md).

## Integration Points with `backend/`
