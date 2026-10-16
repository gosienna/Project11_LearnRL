# Level 1 — Bite checklist (k-armed Bandit)

Progress tracker for instructor mode. One bite at a time; mark `[x]` only after
the user implements and **observes** the effect.

Concept: exploration vs. exploitation. Reference: `reference/k-armed Bandit.pdf`

## Prerequisites (before agent/env)

- [x] **L1.0** `test/helpers/mockRng.js` — scripted `uniform` / `int` / `normal` (categorical deferred to when ε-greedy/UCB needs it)
- [ ] **L1.0b** `core/rng.js` — seeded PRNG (same seed → same sequence) *[Level 0.1]*
- [x] **L1.0c** Vitest project (`package.json` + npm install) — smoke test next

## Agent (headless)

- [ ] **L1.1** Constant-α update: `Q ← Q + α(R − Q)` (fixture → 0.1 then 0.09)
- [ ] **L1.2** Sample-average update equals running mean
- [ ] **L1.3** `α = 0` → Q unchanged
- [ ] **L1.4** Greedy / argmax tiebreak (document lowest-index or random-among-ties)
- [ ] **L1.5** ε-greedy with scripted MockRNG
- [ ] **L1.6** `ε = 0` → always argmax
- [ ] **L1.7** `ε = 1` → always scripted random arm
- [ ] **L1.8** UCB selection (hand fixture)
- [ ] **L1.9** UCB prefers unvisited arms (`N(a)=0` → +∞)

## Environment

- [ ] **L1.10** Bandit env reward distribution (mean/std bound)
- [ ] **L1.11** Cumulative regret from true μ
- [ ] **L1.12** Non-stationary drift changes μ
- [ ] **L1.13** Tier 2: ≥80% optimal-arm rate by 1000 pulls

## Infrastructure / UI (after headless green)

- [ ] Worker + telemetry path
- [ ] Param schema + sliders / equation bindings
- [ ] Charts: Q̂ vs μ, N(a), regret
- [ ] Human mode
- [ ] Non-stationary demo (constant α beats sample-average)

## Current bite

**Active:** L1.0c-test — MockRNG Vitest smoke  
**Status:** in progress — waiting on user
