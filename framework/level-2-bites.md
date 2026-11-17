# Level 2 — Bite checklist (Cliff Walking, tabular TD control)

Progress tracker for instructor mode. Rules for R/G bites, paths, and splitting
are in [README.md](README.md#bite-rules-all-levels).

Concept: state, transitions, discounting, and one-step TD bootstrapping. The
headline is one toggle: Q-learning walks the cliff edge, SARSA takes the detour.

Reuses from L1: `core/rng.js`, MockRNG, `argmax` (lowest-index tiebreak),
`core/schema.js`, the worker, `ui/` widgets, and the site shell. No new
infrastructure except the grid renderer and step mode.

## Read first

`reference/level-2/README.md`, in this order:

1. Sutton & Barto ch. 3 §§3.1–3.5 and ch. 6 §§6.1, 6.4–6.6, using the
   local extracts in `reference/level-2/`.
2. Lilian Weng, *A (Long) Peek into Reinforcement Learning*: Bellman, TD,
   SARSA, Q-learning.
3. David Silver, Lectures 4 and 5. Grid spec: Gymnasium Cliff Walking.

Tests follow [rl-web-tdd-plan.md](rl-web-tdd-plan.md) §3. The demo follows
[rl-web-framework.md](rl-web-framework.md) Level 2.

### Page map

Ch. 3 extract page = book PDF page − 68. Ch. 6 extract page = book PDF page − 140.

| Section | Link |
|---------|------|
| §3.1 The Agent–Environment Interface | [ch. 3 p. 1](../reference/level-2/sutton-barto-chapter-3.pdf#page=1) |
| §3.3 Returns and Episodes | [ch. 3 p. 8](../reference/level-2/sutton-barto-chapter-3.pdf#page=8) |
| §3.5 Policies and Value Functions | [ch. 3 p. 12](../reference/level-2/sutton-barto-chapter-3.pdf#page=12) |
| §6.1 TD Prediction (TD error) | [ch. 6 p. 1](../reference/level-2/sutton-barto-chapter-6.pdf#page=1) |
| §6.4 Sarsa: On-policy TD Control | [ch. 6 p. 11](../reference/level-2/sutton-barto-chapter-6.pdf#page=11) |
| §6.5 Q-learning: Off-policy TD Control | [ch. 6 p. 13](../reference/level-2/sutton-barto-chapter-6.pdf#page=13) |
| Example 6.6 Cliff Walking | [ch. 6 p. 14](../reference/level-2/sutton-barto-chapter-6.pdf#page=14) |
| §6.6 Expected Sarsa | [ch. 6 p. 15](../reference/level-2/sutton-barto-chapter-6.pdf#page=15) |

## Prerequisite

Reference: §3.1 [ch. 3 p. 1](../reference/level-2/sutton-barto-chapter-3.pdf#page=1)
(states and actions as finite sets).

- [ ] **L2.0R** `test/core/spaces.test.js` — `Discrete(4).contains(3)` true,
      `.contains(4)` false, `sample(mockRng)` uses `int` *[TDD 0.5]*
- [ ] **L2.0G** `core/spaces.js` — `Discrete(n)` only (`Box` waits for L4)

## Environment (before any agent code)

Reference: Example 6.6 [ch. 6 p. 14](../reference/level-2/sutton-barto-chapter-6.pdf#page=14),
Gymnasium Cliff Walking spec (start 36, goal 47 on 4×12).
Test file `test/env/gridworld.test.js`; code `env/gridworld.js`.

**Cliff rule (from the book and Gymnasium):** stepping into the cliff gives
−100 and sends the agent back to start. It is **not** terminal. Only the
goal terminates the episode.

- [ ] **L2.1R** A 4×12 layout string parses: `nStates = 48`, `reset()` → 36,
      goal cell 47
- [ ] **L2.1G** Parse a layout string (`S`, `G`, `C`, `#`, `.`) into cell types; `reset`
- [ ] **L2.2R** From 36, `up` → 24 with reward −1
- [ ] **L2.2G** `step(a)`: four moves on a row-major index, −1 per step
- [ ] **L2.3R** Wall blocks movement: `s′ === s` *[TDD 2.7]*
- [ ] **L2.3G** Wall check in `step`
- [ ] **L2.4R** Out of bounds blocked: `s′ === s` *[TDD 2.8]*
- [ ] **L2.4G** Bounds check in `step`
- [ ] **L2.5R** From 36, `right` → reward −100, `s′ = 36`, `terminated` false
- [ ] **L2.5G** Cliff rule
- [ ] **L2.6R** Into the goal → `terminated` true, `truncated` false
- [ ] **L2.6G** Goal rule
- [ ] **L2.7R** `maxSteps = 3`, three steps in open cells → `truncated` true,
      `terminated` false
- [ ] **L2.7G** Step counter and time limit. **Keep `terminated` and `truncated` separate.**
- [ ] **L2.8R** Slip with scripted draws: `uniform < slip` replaces the action
      with `int(4)` → exact `s′` *[TDD 2.9]*
- [ ] **L2.8G** Slip in `step`, drawing only from the env's own `rng`
- [ ] **L2.9** `slip = 0` → deterministic over 100 steps *[TDD 2.10]*. Observe: green.
- [ ] **L2.10R** Hand-coded controllers: edge path (up, 11 × right, down) returns
      −13; safe path (3 × up, 11 × right, 3 × down) returns −17
- [ ] **L2.10G** Observe green. Fix `step` inside this bite if not. This is the
      "env before learning" check from framework §5.

## Agent (headless)

Reference: §6.4 [ch. 6 p. 11](../reference/level-2/sutton-barto-chapter-6.pdf#page=11),
§6.5 [ch. 6 p. 13](../reference/level-2/sutton-barto-chapter-6.pdf#page=13),
§6.6 [ch. 6 p. 15](../reference/level-2/sutton-barto-chapter-6.pdf#page=15),
§3.5 [ch. 3 p. 12](../reference/level-2/sutton-barto-chapter-3.pdf#page=12) for `V` and `q`.
Test file `test/agent/tabular.test.js`; code `agent/tabular.js`.

- [ ] **L2.11R** New agent: `Q` all zeros; `V(s) = max_a Q(s,a)` on a set table *[TDD 2.12]*
- [ ] **L2.11G** `TabularAgent({ nStates, nActions, alpha, gamma, epsilon, algo, rng })`, `V(s)`
- [ ] **L2.12R** Q-learning fixture → `0.4` *[TDD 2.1]*. Write 2.13R's
      expectation (−0.05) in a comment now, before either update exists.
- [ ] **L2.12G** `update(s, a, r, s′, a′, terminated)` with the `max` target
- [ ] **L2.13R** SARSA, same inputs, `a′ = 1` → `−0.05` *[TDD 2.2]*
- [ ] **L2.13G** `algo: 'sarsa'` uses `Q(s′, a′)`
- [ ] **L2.14R** Expected SARSA: `Q(s′,·) = [2, 1]`, `ε = 0.2`, `r = −1`,
      `γ = 0.9`, `α = 0.5`. π = [0.9, 0.1], E = 1.9, δ = 0.71 → `0.355` *[TDD 2.3]*
- [ ] **L2.14G** `algo: 'expected'` with ε-greedy probabilities (same tiebreak as `argmax`)
- [ ] **L2.15R** Terminal → no bootstrap: `−50` *[TDD 2.4]*
- [ ] **L2.15G** `terminated` zeroes the target's bootstrap term
- [ ] **L2.16R** Truncated → bootstraps: `−45.5` *[TDD 2.5]*. Observe: green if
      L2.15G only looked at `terminated`; red means the update conflated the two.
- [ ] **L2.17** `γ = 0` → `Q = αr` *[TDD 2.6]*. Observe: green.
- [ ] **L2.18R** `act(s)` ε-greedy with scripted draws → exact action
- [ ] **L2.18G** `act` reusing L1's pattern and `argmax`
- [ ] **L2.19R** 1×3 corridor, `γ = 1`, `α = 1`, ε = 0, run episodes until
      stable → `Q(1,right) = −1`, `Q(0,right) = −2` to 1e-10 *[TDD 2.11]*
- [ ] **L2.19G** `runEpisode(env, agent)` helper in `agent/tabular.js`. Observe: green.
- [ ] **L2.20R** ε decay: `ε₀ = 1`, ×0.5 per episode, floor 0.1 →
      `1, 0.5, 0.25, 0.125, 0.1`
- [ ] **L2.20G** `endEpisode()` applies the schedule
- [ ] **L2.21R** `test/slow/l2.slow.test.js` — on the standard layout, greedy
      path after training: Q-learning hugs row 2 (13 steps); SARSA's path is
      longer *[TDD 2.13]*. Observe with `npm run test:slow`.
- [ ] **L2.21G** Observe green on `npm run test:slow`. If red, find the Tier 0 gap first.

## Site: `/l2`

Reference: Example 6.6 [ch. 6 p. 14](../reference/level-2/sutton-barto-chapter-6.pdf#page=14)
(the gridworld figure and the paths it shows; render the page to describe it).

- [ ] **L2.22** `site/levels.js` — L2 points at `pages/L2.jsx` and its test
      files. Observe: `/tests` shows an L2 group; slot 2 on `/` is a live link.
- [ ] **L2.23** `env/gridworld.js` — `render(ctx, state)` draws cells by type and
      the agent. Pure: it never steps. Observe: the cliff grid on `/l2`.
- [ ] **L2.24** `runner/worker.js` — send `Q` (flat `Float32Array`) in telemetry
      for L2. Observe: the length is 48 × 4 in the console.
- [ ] **L2.25** `pages/L2.jsx` — `V(s)` heatmap under the grid. Observe: the
      cells near the goal warm up first.
- [ ] **L2.26** `pages/L2.jsx` — greedy arrows per cell. Observe: arrows flip as training runs.
- [ ] **L2.27** `pages/L2.jsx` — four-triangle Q display per cell. Observe: the
      triangle pointing into the cliff turns dark.
- [ ] **L2.28** `pages/L2.jsx` — episode return curve (reuse `LineChart`).
      Observe: it rises toward −13 / −17.
- [ ] **L2.29** `pages/L2.jsx` — schema sliders: `α`, `γ`, `ε`, decay, slip,
      algorithm select. Observe: switching algo mid-run changes the arrows.
- [ ] **L2.30** `runner/worker.js` — `stepOnce` sends the literal
      `(s, a, r, s′, a′, δ)` of that one update. Observe: the console prints one tuple per click.
- [ ] **L2.31** `ui/EquationPanel.jsx` — fill the TD equation with those
      literal numbers. Observe: numbers match a hand calculation.
- [ ] **L2.32** `pages/L2.jsx` — `δ` flashes on the changed cell. Observe: one cell blinks per step.
- [ ] **L2.33** `pages/L2.jsx` — paint cell types with the mouse. Observe: a
      painted wall blocks the agent.
- [ ] **L2.34** `pages/L2.jsx` — **Q-learning vs SARSA preset** on the standard
      layout. Observe: edge path vs. detour, side by side. Quote Example 6.6 here.

## Current bite

**Active:** — (starts when Level 1 is complete)  
**Status:** not started
