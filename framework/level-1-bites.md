# Level 1 — Bite checklist (k-armed Bandit)

Progress tracker for instructor mode. One bite at a time; mark `[x]` only after
the user implements and **observes** the effect.

Concept: exploration vs. exploitation. No state, no bootstrapping.

## Read first

`reference/level-1/README.md` — three sources, in this order:

1. Sutton & Barto ch. 2 extract: `reference/level-1/sutton-barto-chapter-2.pdf`
   (§§2.1–2.7). Skip §2.8 gradient bandits and §2.9 contextual bandits.
2. Lilian Weng, *The Multi-Armed Bandit Problem and Its Solutions* (ε-greedy,
   UCB, regret). Thompson sampling is extra; this level does not implement it.
3. David Silver, Lecture 9, through ε-greedy and upper confidence bounds.

Tests and the demo follow `framework/rl-web-tdd-plan.md` §2 and
`framework/rl-web-framework.md` Level 1 plus §2.10. One site: `/` is the
ladder, `/l1` is this demo, `/tests` runs the same files as `npm test`.

## Prerequisites (before agent/env)

- [ ] **L1.0** `test/helpers/mockRng.js` — scripted `uniform` / `int` / `normal`
      (`categorical` waits until ε-greedy needs it)
- [ ] **L1.0b** `src/core/rng.js` — seeded PRNG (same seed → same sequence)
      *[TDD 0.1]*
- [ ] **L1.0c** Vitest project (`package.json` scripts `dev`, `test`,
      `test:slow`, `test:all`) — `npm test` is the fast loop; `/tests` will
      run these same files once the shell exists

## Agent (headless)

Hand-computed fixtures from the TDD plan. Observe with `npm test`.

- [ ] **L1.1** Constant-α update: `Q ← Q + α(R − Q)` (fixture → 0.1 then 0.09)
- [ ] **L1.2** Sample-average update equals running mean
- [ ] **L1.3** `α = 0` → Q unchanged
- [ ] **L1.4** Greedy / argmax tiebreak (document lowest-index or random-among-ties)
- [ ] **L1.5** ε-greedy with scripted MockRNG
- [ ] **L1.6** `ε = 0` → always argmax
- [ ] **L1.7** `ε = 1` → always scripted random arm
- [ ] **L1.8** UCB selection (hand fixture → arm 0)
- [ ] **L1.9** UCB prefers unvisited arms (`N(a)=0` → +∞)

## Environment

- [ ] **L1.10** Bandit env reward distribution (mean/std bound)
- [ ] **L1.11** Cumulative regret from true μ (fixture → 1.3)
- [ ] **L1.12** Non-stationary drift changes μ
- [ ] **L1.13** Tier 2: ≥80% optimal-arm rate by 1000 pulls (`ε=0.1`, `k=10`,
      `σ=1`). File: `test/slow/l1.slow.test.js`. Observe with
      `npm run test:slow`, not the fast watch loop.

## Site (after headless green)

The shell is one website for all five levels. L1 replaces only its own slot.

- [ ] **L1.14** `src/site/` + `npm run dev` — `/` shows five ladder slots.
      L2–L5 say "not built yet". Observe: open `/`.
- [ ] **L1.15** `/tests` runs the L1 fast files (registered in
      `src/site/levels.js`). Observe: **Run this level** matches `npm test`
      for those files. No second set of expected values.
- [ ] **L1.16** Worker + telemetry — training on `/l1`, main thread only renders
- [ ] **L1.17** Param schema drives sliders and the on-screen update equation
- [ ] **L1.18** Charts on `/l1`: Q̂ vs μ, N(a), cumulative regret
- [ ] **L1.19** Human mode: the user pulls arms and is scored against the agent
- [ ] **L1.20** Non-stationary demo: constant α visibly beats sample-average.
      Ladder badge on `/` shows the last L1 fast-suite result.

## Current bite

**Active:** L1.0 — MockRNG  
**Status:** not started
