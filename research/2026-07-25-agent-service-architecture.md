---
topic: Agent-service architecture — unified vs. split
status: resolved
date: 2026-07-25
related_adr: ../docs/architecture/decisions/0004-agent-service-architecture.md
---

# Agent-Service Architecture: Unified vs. Split

## Question

Nabu's agent-facing component needs to support both a customer-facing chat/assistant and backend automation (e.g. triaging incoming vulnerability scan results, auto-creating/updating tickets). Should this be one unified agent service (Claude Agent SDK) handling both, or split — a dedicated chat service plus automation logic embedded directly in the Go backend, calling the Claude API where needed?

## Findings

The two paths differ mainly in where automation logic lives relative to the data it acts on, and how much tool-use machinery that automation actually needs:

- **Chat** is inherently open-ended and conversational — a good fit for the Claude Agent SDK's context management and tool-orchestration loop, regardless of which option is chosen.
- **Automation** as currently scoped (ingest a scan result → classify/dedupe → create or update a ticket) is comparatively narrow and structured. It may not need a full agentic tool-use loop at all — a single well-prompted call (or even non-LLM heuristics for some steps) could suffice for the first version.
- There's no official Anthropic Agent SDK for Go, so any automation embedded in the backend would either use direct Anthropic API calls (simple, no SDK dependency) or stay agent-SDK-free entirely for now.

### Model/runtime hosting: direct Anthropic API vs. Bedrock

This is a separate axis from unified-vs-split — it applies to either architecture — but was missing from the original research. The Claude Agent SDK isn't a competitor to Bedrock; it can run on top of it. Three real options, given Nabu is already fully AWS-native (CDK, ECS Fargate, S3+CloudFront):

1. **Claude Agent SDK + direct Anthropic API**, self-hosted on Nabu's own AWS compute (e.g. the same ECS Fargate pattern as the backend). Simplest to build, fastest access to new Claude platform features — Bedrock trails direct API by some months on newer platform capabilities (Managed Agents platform, skills system, native code execution/web search), though it does carry current models (Opus 5, Sonnet 5, Haiku 4.5). Trade-off: a separate vendor/billing relationship outside AWS.
2. **Claude Agent SDK + Bedrock-hosted Claude models**, still self-hosted orchestration. Keeps the SDK's mature tool-orchestration and context management, but routes model calls through Bedrock — consolidates billing/IAM under AWS at the cost of the platform-feature lag above.
3. **Claude Agent SDK deployed onto Bedrock AgentCore Runtime** — a fully-managed hosting layer AWS ships for exactly this: isolated per-session microVMs, up to 8hr session state, built-in Code Interpreter/Browser tools, and a Gateway that turns REST APIs/Lambdas into agent tools. Offloads runtime/session/isolation concerns to AWS at the cost of adopting its operational model.

Given the product is still in its exploratory/prototype stage, (1) is the better starting point — fastest iteration, no feature lag, no premature commitment to AgentCore's operational model. Revisit Bedrock (either for vendor consolidation or AgentCore's managed session/tooling) once there's a concrete driver — e.g. an enterprise customer's compliance requirement around data staying inside a defined cloud boundary, relevant given this is itself a security product, or a real need for AgentCore's built-in isolation/session management as usage grows.

### Related protocols (A2A / A2UI)

Two open protocols surfaced during research, both worth noting even though neither changes the recommendation below:

- **A2A (Agent2Agent)** — a Linux Foundation-governed protocol for *opaque, cross-vendor* agents to discover each other and delegate tasks. It solves interoperability between agents owned by different, mutually untrusting parties — not the situation between Nabu's own chat service and its own backend automation, which are owned end-to-end by the same team (a normal internal API is the right tool there). Worth keeping in mind if Nabu's agent ever needs to interoperate with an external third party's own agent (e.g. a scanner vendor's), but not a driver for this decision today.
- **A2UI** (declarative JSON format for agent-generated rich UI — forms, cards) and **AG-UI** (the transport connecting an agentic frontend to an agentic backend that A2UI payloads travel over) — relevant not to unified-vs-split itself, but to *how* the chat component talks to the frontend if chat responses should include rich UI rather than plain text. Both have existing React renderer support (fits the already-decided Vite+React frontend). This mildly reinforces the split option: it implies treating chat as a distinct, addressable agent endpoint, which is exactly what a dedicated chat service already looks like.

## Options Considered

### Unified agent service (TS, Claude Agent SDK, handles both)

**Pros**
- One place for all agent logic, tool definitions, and context/prompt management — chat and automation can share the same tool set (e.g. "look up ticket", "create ticket", "query vulnerability") instead of implementing it twice.
- Full benefit of the Agent SDK's built-in context management, tool orchestration, and subagent patterns for both use cases.
- Single deployment/scaling profile to reason about for "the agent."

**Cons**
- Backend automation triggered by ingestion events must call out to a separate service — a network hop between data arriving and a ticket being created/updated, and a harder story for transactional consistency (e.g. "create ticket + link to vulnerability" as one atomic operation).
- Adds a second service and language (TS) alongside the Go backend, with its own deployment pipeline and on-call surface.
- Couples automation's reliability to chat-service uptime even though they have different traffic/latency profiles.

### Split: dedicated chat service (TS) + automation embedded in the Go backend

**Pros**
- Automation lives next to the data it acts on — ticket creation/update can be a normal in-process function call and a single DB transaction, no network hop or partial-failure window.
- Automation can start as simple, direct calls to the Anthropic API (or non-LLM logic) for narrowly-scoped tasks like severity classification or dedup, without needing agent-loop complexity.
- Failure isolation: automation only depends on the backend (already a hard dependency); a chat-service outage doesn't block ticket ingestion, and vice versa.
- Chat service is still free to use the full Agent SDK for the genuinely open-ended, tool-rich conversational experience.

**Cons**
- Duplication risk: if chat and automation both need "look up ticket" or "search vulnerabilities" logic, it ends up implemented twice — once as TS tool definitions, once as Go functions — and has to be kept in sync.
- No official Agent SDK for Go means any future growth toward more open-ended, multi-step automation has to be hand-rolled rather than inherited from the SDK.
- Two separate places to enforce agent-related conventions (TS chat service, Go-embedded automation) instead of one.

## Recommendation

Lean toward the **split**, at least to start: the automation work described so far (triage, dedup, ticket creation from scan results) is narrow and benefits most from living next to the data with normal transactional guarantees, while the chat experience is the part that actually needs the Agent SDK's tool-orchestration machinery. Revisit if automation grows into something more open-ended and tool-heavy — at that point the duplication cost of the split option starts to outweigh its data-locality benefit, and migrating automation into the unified service (or at least sharing tool definitions between the two) becomes worth it. The A2A/A2UI research above doesn't change this call, but adds a concrete direction for the chat service's frontend-facing interface (AG-UI/A2UI) once split is confirmed.

On the separate model/runtime-hosting axis: lean toward **Claude Agent SDK + direct Anthropic API**, self-hosted, for now — fastest iteration while still in the exploratory/prototype stage, revisited toward Bedrock (model-hosting or full AgentCore Runtime) once there's a concrete compliance or vendor-consolidation driver.
