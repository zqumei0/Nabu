---
topic: Frontend package manager — npm vs. yarn vs. bun
status: resolved
date: 2026-08-24
related_adr:
---

# Frontend Package Manager: npm vs. Yarn vs. Bun

## Question

The frontend (`frontend/`, per [ADR-0007](../../docs/architecture/decisions/0007-vite-react-frontend.md): Vite + React SPA) hasn't been scaffolded yet — no `package.json` exists anywhere in the repo. Which package manager should install and run its dependencies: npm, Yarn, or Bun? This also implicitly covers whether the JS *runtime* used for tooling (Vite dev server, Vitest, build) should stay Node or move to Bun's runtime, since Bun bundles both concerns.

## Findings

### Current environment (checked directly in this repo's dev machine)

- **Node v26.5.1** and **npm 11.17.0** are installed (`/opt/homebrew/bin/`).
- **Yarn Classic (v1.22.22)** is installed, but nothing in the repo assumes it.
- **Bun and pnpm are not installed.**
- No `package.json`, `.nvmrc`, `.yarnrc*`, `pnpm-lock.yaml`, or `bun.lockb` exists anywhere in the repo — a clean slate. `infra/` (CDK, TypeScript) is also not yet scaffolded, so there is no existing JS workspace to be compatible with.
- Root `.gitignore` already has a Node/TypeScript section (`node_modules/`, `dist/`, `build/`, `*.tsbuildinfo`, `coverage/`, `npm-debug.log*`) — no lockfile-specific ignores yet, since none has been chosen.

### What actually differs between the three, for a single-package SPA repo

**Install speed & disk usage.** Bun's installer is the fastest in most published benchmarks (native, no JS startup overhead), often noticeably faster than npm on cold installs. Yarn Berry (PnP mode) and pnpm are the disk-efficient options via content-addressable storage / symlinking; Yarn Classic and npm both use a flat, duplicated `node_modules`. For a project of this size (one SPA, a few dozen dependencies once React Router/TanStack Query/Tailwind/Vitest land), install time differences are on the order of single-digit seconds — real, but not a driver at this scale. This becomes more relevant if CI runs installs on every PR without caching, or if the dependency tree grows substantially (e.g. a heavy component library).

**Lockfile format & CI support.** `package-lock.json` (npm) has first-class, zero-config support in `actions/setup-node`'s built-in dependency caching (`cache: 'npm'`). Yarn and pnpm need `cache: 'yarn'` / `cache: 'pnpm'` respectively (still built in, just a different value) plus, for pnpm, an extra `pnpm/action-setup` step since pnpm itself isn't preinstalled on GitHub-hosted runners. Bun needs `oven-sh/setup-bun` — not part of `actions/setup-node` at all, since it's a different toolchain entirely. Given [ADR-0003](../../docs/architecture/decisions/0003-cicd-github-actions.md) already committed to GitHub Actions and no CI workflow exists yet, npm is the least additional CI setup; Bun is the most (an entirely separate action, and GitHub-hosted runners don't ship Bun's runtime the way they ship Node).

**Workspace/monorepo support.** Yarn (Classic and Berry) and pnpm both have long-standing, mature workspace support; Bun's workspace support is functional but newer and less battle-tested; npm workspaces work but are generally considered the least ergonomic of the four. This matters for Nabu *if and when* `infra/` (CDK/TypeScript) gets scaffolded and the repo wants to share tooling/config (e.g. a shared `tsconfig` base, shared ESLint config) between `frontend/` and `infra/` as an actual npm/yarn/pnpm workspace rather than two fully independent packages. That's not decided or requested yet — flagged as a real future consideration, not a driver today.

**Runtime, not just package manager (Bun's actual differentiator).** Bun is a package manager *and* a JS/TS runtime *and* a bundler *and* a test runner. Choosing Bun here could mean either (a) using `bun install` purely as a faster npm-compatible package manager while everything else (Vite dev server, Vitest, `tsc`) still runs on Node, or (b) going further and running Vite itself under Bun's runtime and/or replacing Vitest with Bun's built-in test runner. Option (a) is a low-commitment, easily-reversible choice (Bun can consume/produce npm-compatible lockfiles). Option (b) is a much bigger bet — Bun's own bundler/test runner are less proven than Vite+Vitest specifically, and nothing about ADR-0007's reasoning (which was about React meta-framework choice, not the JS toolchain underneath it) calls for it.

**Ecosystem maturity / native addon compatibility.** npm has the longest track record; virtually every package's install/postinstall scripts and native addons (node-gyp-based, etc.) are tested against it first. Yarn Classic is old and stable but increasingly unmaintained relative to newer tooling. Bun's npm-registry compatibility is generally good for pure-JS/TS packages (which is nearly everything this SPA will need: React, React Router, TanStack Query, Tailwind), but edge cases with certain native or postinstall-script-heavy packages have historically surfaced — a smaller risk than it was a year or two ago, but still a real (if narrowing) gap versus npm's near-universal compatibility.

**Security auditing.** All three ship an audit command against known-vulnerability databases (`npm audit`, `yarn audit`, `bun audit`, the last added relatively recently). Roughly equivalent for this project's purposes; not a differentiator.

**Governance / stability.** npm is maintained by npm, Inc. (GitHub/Microsoft-backed) and ships with Node itself. Yarn is maintained by the Yarn/Berry team (originally Facebook-backed, now community). Bun is maintained by Oven, a smaller, venture-funded company with a faster release cadence — generally a positive for feature velocity, but a different risk profile than a tool bundled directly with the Node runtime itself.

## Options Considered

### npm

**Pros**
- Zero setup — already installed alongside Node, nothing new to provision on this machine or in CI.
- Simplest CI integration: `actions/setup-node` with `cache: 'npm'`, no extra action needed.
- Broadest compatibility — every package, every doc, every Stack Overflow answer assumes it by default.
- `package-lock.json` is well understood and widely tooled around (Dependabot, Renovate, etc. all support it natively).

**Cons**
- Slower installs and a larger, more duplicated `node_modules` than pnpm/Bun — a real but currently minor cost at this project's size.
- Weakest workspace ergonomics of the four, if `frontend/`+`infra/` workspaces become desired later.

### Yarn (Classic v1)

**Pros**
- Already installed locally, so no new install step either.
- Long-standing, stable, well-documented.

**Cons**
- No longer meaningfully faster or more disk-efficient than modern npm — the performance case for Yarn Classic specifically (vs. npm) that existed years ago has mostly closed.
- The interesting parts of "Yarn" today (PnP, zero-installs, workspace protocol improvements) live in Yarn Berry (v3/v4), a different major version with a different config format (`.yarnrc.yml`, `.pnp.cjs`) — adopting "Yarn" today without deliberately choosing Berry gets none of Yarn's current differentiators, just its CI setup cost (a distinct cache key from npm) for no corresponding benefit.
- If Berry were chosen instead: PnP mode breaks some tooling that expects a real `node_modules` folder on disk (some editor extensions, some packages with filesystem assumptions) unless `nodeLinker: node-modules` is explicitly set, which then gives up PnP's main benefit anyway.

### Bun

**Pros**
- Fastest installs among the three in most benchmarks; also usable as a full runtime/bundler/test-runner if that's ever wanted.
- Modern, actively developed, npm-registry compatible (can read/write npm-style lockfiles in recent versions).

**Cons**
- Not installed locally or anywhere in CI — a new tool to provision on every developer machine and in GitHub Actions (`oven-sh/setup-bun`, separate from `actions/setup-node`).
- Smaller ecosystem track record for edge-case native/postinstall-heavy packages, though this gap has been narrowing.
- Going beyond "just the package manager" (e.g. Bun's own bundler or test runner replacing Vite/Vitest) would be a materially bigger, less-tested bet with no current driver — ADR-0007 chose Vite specifically, and Vitest is Vite's own first-party test runner.
- Smallest, youngest governance/maintainer base of the three.

## Recommendation

**npm.** For a single, just-starting-out SPA package with no existing JS workspace to be compatible with, none of Bun's or Yarn's differentiators (install speed, PnP, workspace ergonomics) offer enough benefit at this scale to justify provisioning and maintaining a second toolchain beyond what's already installed and what CI already expects to use (`actions/setup-node`, no extra setup action). npm is also the safest default for onboarding — any future contributor or agent working in this repo needs zero extra setup beyond Node itself.

Revisit if either becomes concretely true:
- **`infra/` gets scaffolded as a real JS workspace alongside `frontend/`** (shared tsconfig/eslint config, cross-package imports) — at that point Yarn Berry or pnpm's mature workspace support becomes a real, not hypothetical, benefit.
- **Install/CI time becomes an actual measured pain point** (e.g. dependency tree grows substantially, or CI install time is a noticeable fraction of pipeline duration) — at that point Bun's install speed becomes worth the added toolchain cost.

Neither is true today, so npm is the lowest-cost, lowest-risk choice to scaffold the frontend with.
