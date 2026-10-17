# Level 1 — Bite checklist (k-armed Bandit)

Progress tracker for instructor mode. One bite at a time; mark `[x]` only after
the learner implements and **observes** the effect. Rules for R/G bites, paths,
and splitting are in [README.md](README.md#bite-rules-all-levels).

Concept: exploration vs. exploitation. No state, no bootstrapping. Level 1 also
builds the shared seams (RNG, schema, worker, site shell) that Levels 2–5
reuse, so it is longer than its algorithm.

## Read first

`reference/level-1/README.md`, in this order:

1. Sutton & Barto ch. 2 extract,
   [reference/level-1/sutton-barto-chapter-2.pdf](../reference/level-1/sutton-barto-chapter-2.pdf)
   (§§2.1–2.7). Skip §2.8 gradient bandits and §2.9 contextual bandits.
2. Lilian Weng, *The Multi-Armed Bandit Problem and Its Solutions*
   (ε-greedy, UCB, regret). Thompson sampling is extra.
3. David Silver, Lecture 9, through ε-greedy and upper confidence bounds.

Tests follow [rl-web-tdd-plan.md](rl-web-tdd-plan.md) §1–§2. The demo follows
[rl-web-framework.md](rl-web-framework.md) Level 1 and §2.6, §2.10.

### Page map (extract PDF pages; extract page = full-book PDF page − 44)

| Section | Link |
|---------|------|
| §2.1 A k-armed Bandit Problem | [p. 3](../reference/level-1/sutton-barto-chapter-2.pdf#page=3) |
| §2.2 Action-value Methods (ε-greedy) | [p. 5](../reference/level-1/sutton-barto-chapter-2.pdf#page=5) |
| §2.3 The 10-armed Testbed | [p. 6](../reference/level-1/sutton-barto-chapter-2.pdf#page=6) |
| §2.4 Incremental Implementation | [p. 8](../reference/level-1/sutton-barto-chapter-2.pdf#page=8) |
| §2.5 Tracking a Nonstationary Problem | [p. 10](../reference/level-1/sutton-barto-chapter-2.pdf#page=10) |
| §2.7 Upper-Confidence-Bound Action Selection | [p. 13](../reference/level-1/sutton-barto-chapter-2.pdf#page=13) |
| Seeded RNG (not in the book) | [reference/level-1/xorshift32.md](../reference/level-1/xorshift32.md) |

## Setup and seeded RNG

Reference: [xorshift32.md](../reference/level-1/xorshift32.md). The book does
not cover PRNGs.

**Differs from the framework:** §2.2 of the framework names
xorshift128+ / PCG32. Level 1 uses xorshift32 because every bit of one draw
can be checked by hand. The `uniform()` interface is the same, so a stronger
generator can replace it later without touching any caller.

- [ ] **L1.0a** `package.json` (repo root) — scripts `dev`, `test`, `test:slow`,
      `test:all` pointing Vite and Vitest at `student/`; dev-deps `vite`, `vitest`.
      Observe: `npm test` runs and reports no test files, rather than "command not found".
- [ ] **L1.0bR** `test/helpers/mockRng.test.js` — MockRNG replays `[0.1, 0.7]`,
      `int(4)` on 0.7 is 2, an over-draw is `undefined`. Observe: red (module missing).
- [x] **L1.0bG** `test/helpers/mockRng.js` — `uniform` / `int` / `normal`
      (`categorical` waits for L3). Observe: green.
- [ ] **L1.0cR** `test/core/rng.test.js` — same seed → identical 1000 draws;
      different seed → differs *[TDD 0.1]*. Observe: red.
- [x] **L1.0cG** `core/rng.js` — constructor stores the seed as a 32-bit state;
      `uniform` does three xorshift steps. Observe: green.
- [ ] **L1.0dR** `test/core/rng.test.js` — seed 1's first draw is
      `270369 / 2^32`, and seed 0 throws (hand values in xorshift32.md).
      Observe: red or green. If green, say why the earlier G already covered it.
- [ ] **L1.0dG** `core/rng.js` — reject a zero state *after* the 32-bit conversion.
      Observe: green.
- [ ] **L1.0e** `test/core/rng.test.js` — 10⁶ uniforms: mean ∈ [0.499, 0.501],
      all in [0, 1) *[TDD 0.2]*. Observe: green with no new code.
- [ ] **L1.0fR** `test/core/rng.test.js` — 10⁶ normals: mean 0 ± 0.01, std 1 ± 0.01
      *[TDD 0.3]*. Observe: red.
- [ ] **L1.0fG** `core/rng.js` — `int(n)` and `normal()` (Box–Muller from two
      uniforms; guard `log(0)`). Observe: green.

## Agent (headless)

Reference: §2.2 [p. 5](../reference/level-1/sutton-barto-chapter-2.pdf#page=5),
§2.4 [p. 8](../reference/level-1/sutton-barto-chapter-2.pdf#page=8),
§2.5 [p. 10](../reference/level-1/sutton-barto-chapter-2.pdf#page=10),
§2.7 [p. 13](../reference/level-1/sutton-barto-chapter-2.pdf#page=13).
Test file `test/agent/bandit.test.js`; code `agent/bandit.js`.

- [ ] **L1.1R** Constant-α fixture: 0.1 then 0.09 *[TDD 1.1]*
- [ ] **L1.1G** `BanditAgent` with `Q[]`, `N[]`, `update(a, r)` for constant α
- [ ] **L1.2R** Sample-average on `[1, 0, 2]` equals the mean (1.0) *[TDD 1.2]*
- [ ] **L1.2G** Step-size selector: `alpha = null` means `1/N`
- [ ] **L1.3** `α = 0` → Q unchanged *[TDD 1.3]*. Observe: green with no new code.
- [ ] **L1.4R** Greedy on tied Q returns the lowest index; the rule is in the
      test name *[TDD 1.4]*. **This tiebreak is reused in L2–L5.**
- [ ] **L1.4G** `argmax` helper, lowest-index tiebreak
- [ ] **L1.5R** ε-greedy with scripted draws → exact arm *[TDD 1.5]*
- [ ] **L1.5G** `act()`: one uniform against ε, then `int(k)` or argmax
- [ ] **L1.6** `ε = 0` → always argmax *[TDD 1.6]*. Observe: green.
- [ ] **L1.7** `ε = 1` → always the scripted random arm *[TDD 1.7]*. Observe: green.
- [ ] **L1.8R** UCB fixture `Q=[0.5,0.3]`, `N=[1,3]`, `t=4`, `c=2` → arm 0 *[TDD 1.8]*
- [ ] **L1.8G** UCB branch in `act()`
- [ ] **L1.9R** An unvisited arm wins (`N(a)=0` → +∞) *[TDD 1.9]*
- [ ] **L1.9G** Unvisited guard in the UCB score

## Environment

Reference: §2.3 [p. 6](../reference/level-1/sutton-barto-chapter-2.pdf#page=6)
(testbed), §2.5 [p. 10](../reference/level-1/sutton-barto-chapter-2.pdf#page=10)
(non-stationary). Test file `test/env/bandit.test.js`; code `env/bandit.js`.

- [ ] **L1.10R** 10⁴ pulls of arm `μ=2, σ=1`: sample mean within 0.05 of 2,
      sample std within 0.05 of 1 *[TDD 1.10]*
- [ ] **L1.10G** `BanditEnv({ mu, sigma, rng })` with `step(a)` returning the
      standard `{ obs, reward, terminated, truncated, info }`
- [ ] **L1.11R** Regret on `μ=[1, 0.5, 0.2]`, pulls `[1,2,0,0]` → 1.3, from
      *true* means *[TDD 1.11]*
- [ ] **L1.11G** Track regret in `info` (or a helper) from `μ`, not rewards
- [ ] **L1.12R** Non-stationary drift: after 100 steps, `μ` differs *[TDD 1.12]*
- [ ] **L1.12G** Drift `μ_k += 0.01·N(0,1)` per step when `nonstationary`
- [ ] **L1.13R** `test/slow/l1.slow.test.js` — ≥80% optimal-arm rate by 1000
      pulls (`ε=0.1`, `k=10`, `σ=1`), averaged over seeded runs *[TDD 1.13]*.
      Observe with `npm run test:slow`.
- [ ] **L1.13G** Observe green on `npm run test:slow`. If it is red, do not
      tune: find the missing Tier 0 test first (TDD plan §8).

## Site shell (one site for all five levels)

Reference: [rl-web-framework.md §2.10](rl-web-framework.md) (not in the book).

- [ ] **L1.14a** `vite.config.js` (repo root) — root `student/`, React plugin,
      Vitest `include`/`exclude` for the slow folder. Observe: `npm run dev` serves.
- [ ] **L1.14b** `index.html` — a mount node and the `site/App.jsx` script.
      Observe: blank page, no console error.
- [ ] **L1.14c** `site/levels.js` — five entries (id, title, concept, `page`
      loader or null, `tests` globs). Observe: `console.table` of five rows.
- [ ] **L1.14d** `site/App.jsx` — `/` renders the ladder from `levels.js`;
      a null page shows "not built yet". Observe: five slots on `/`.
- [ ] **L1.14e** `site/App.jsx` — routes `/l1`…`/l5` mount the page or a
      placeholder (goal, concept, next milestone). Observe: `/l3` shows its placeholder.
- [ ] **L1.15a** `site/TestBench.jsx` — `/tests` lists test files grouped
      core, L1…L5 from `levels.js`. Observe: the L1 files appear.
- [ ] **L1.15b** `site/TestBench.jsx` — **Run this level** shows file, test,
      pass/fail, message. Observe: same results as `npm test` for those files.
      Choose the mechanism here (Vitest browser mode or the JSON reporter);
      write the choice in `framework/rl-web-framework.md` §2.10.
- [ ] **L1.15c** `site/TestBench.jsx` — **Run fast** and **Run slow**.
      Observe: slow runs only when pressed.

## Worker and telemetry

Reference: [rl-web-framework.md §2.6](rl-web-framework.md) (not in the book).

- [ ] **L1.16a** `runner/protocol.js` — message type constants
      (`start`, `pause`, `reset`, `stepOnce`, `setParam`, `telemetry`). Observe:
      importing it in the console lists the types.
- [ ] **L1.16b** `runner/worker.js` — on `start`, loop env + agent; on `pause`, stop.
      Observe: a `console.log` step count from the worker rises, then stops on pause.
- [ ] **L1.16c** `runner/worker.js` — accumulate metrics and flush `telemetry`
      on a ~10 Hz timer, not every step. Observe: about 10 messages a second.
- [ ] **L1.16d** `runner/telemetry.js` — per-metric ring buffer on the main thread.
      Observe: buffer length caps at its capacity.
- [ ] **L1.16e** `pages/L1.jsx` — start/pause buttons; show the latest step.
      `levels.js` now points L1 at this page. Observe: `/l1` counts up and slot 1
      on `/` is a live link.
- [ ] **L1.16f** `runner/worker.js` — `stepOnce`: one pull, one telemetry flush.
      Observe: one click moves the step by one.

## Param schema, sliders, equation

Reference: §2.4 [p. 8](../reference/level-1/sutton-barto-chapter-2.pdf#page=8)
for the update shown on screen; schema design is framework §2.1.

- [ ] **L1.17aR** `test/core/schema.test.js` — `deserialize(serialize(s))`
      deep-equals `s` *[TDD 0.10]*
- [ ] **L1.17aG** `core/schema.js` — `serialize` / `deserialize` / `applyPatch`
- [ ] **L1.17b** `ui/Slider.jsx` — one knob from a schema entry (min, max, log).
      Observe: the slider moves its own label.
- [ ] **L1.17c** `pages/L1.jsx` — `buildControls(bandit schema)` renders `ε`,
      `α`, `c`, `seed`. Observe: four sliders.
- [ ] **L1.17d** `runner/worker.js` — `setParam` patches the live agent.
      Observe: dragging ε to 1 makes the pull counts flatten out mid-run.
- [ ] **L1.17e** `ui/EquationPanel.jsx` — KaTeX `Q ← Q + α(R − Q)` with `α`
      bound to the schema. Observe: the α in the equation follows the slider.
- [ ] **L1.17f** `pages/L1.jsx` — URL hash carries `serialize(schema)`.
      Observe: reload restores the slider values.

## Charts

Reference: §2.3 [p. 6](../reference/level-1/sutton-barto-chapter-2.pdf#page=6)
(Figure 2.2 is the average-reward and %-optimal curve the charts imitate).

- [ ] **L1.18a** `ui/Histogram.jsx` — bars with optional ghost bars.
      Observe: a static array draws.
- [ ] **L1.18b** `pages/L1.jsx` — Q̂(a) bars over ghost μ_k. Observe: bars
      climb toward the ghosts as training runs.
- [ ] **L1.18c** `pages/L1.jsx` — pull counts N(a). Observe: the best arm dominates.
- [ ] **L1.18d** `ui/LineChart.jsx` — polyline from a telemetry ring buffer.
      Observe: a static series draws.
- [ ] **L1.18e** `pages/L1.jsx` — cumulative regret curve. Observe: it bends flat
      once the agent finds the best arm.

## Human mode, non-stationary demo

Reference: §2.5 [p. 10](../reference/level-1/sutton-barto-chapter-2.pdf#page=10).
> Key passage to quote in L1.20: the paragraph about constant step-size weighting recent rewards.

- [ ] **L1.19a** `pages/L1.jsx` — clicking an arm pulls it through the same
      env (own seed). Observe: the reward appears.
- [ ] **L1.19b** `pages/L1.jsx` — human vs. agent regret, side by side.
      Observe: the score updates per click.
- [ ] **L1.20a** `pages/L1.jsx` — `nonstationary` toggle and draggable μ_k.
      Observe: the ghost bars wander.
- [ ] **L1.20b** `runner/worker.js` — run a constant-α agent and a 1/N agent
      on the same env stream. Observe: two regret curves; constant α wins under drift.
- [ ] **L1.20c** `site/App.jsx` — ladder badge shows the last L1 fast-suite
      result. Observe: a green badge on slot 1.

## Current bite

**Active:** L1.0a — `package.json` and Vitest  
**Learner:** kewei · `learn/kewei`  
**Done:** 2  
**Status:** in progress
