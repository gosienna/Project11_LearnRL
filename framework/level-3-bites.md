# Level 3 — Bite checklist (REINFORCE on CartPole)

Progress tracker for instructor mode. Rules for R/G bites, paths, and splitting
are in [README.md](README.md#bite-rules-all-levels).

Concept: function approximation and the policy gradient. The state is
continuous, so a table no longer fits; a small network is the policy. Stop
before actor-critic (that is Level 4).

New shared code: `core/stats.js`, `rng.categorical`, `agent/lib/returns.js`,
and the `nn/` façade over TF.js. Everything else is reused from L1–L2.

## Read first

`reference/level-3/README.md`, in this order:

1. Sutton & Barto ch. 13 §§13.1–13.4, using the local extract in `reference/level-3/`.
2. OpenAI Spinning Up, Part 3, through the baseline section.
3. Karpathy, *Pong from Pixels*, for intuition.

Env spec: Gymnasium CartPole-v1. Tests follow
[rl-web-tdd-plan.md](rl-web-tdd-plan.md) §4. The demo follows
[rl-web-framework.md](rl-web-framework.md) Level 3.

### Page map (ch. 13 extract page = book PDF page − 342)

| Section | Link |
|---------|------|
| §13.1 Policy Approximation and its Advantages (softmax in action preferences) | [p. 2](../reference/level-3/sutton-barto-chapter-13.pdf#page=2) |
| §13.2 The Policy Gradient Theorem | [p. 4](../reference/level-3/sutton-barto-chapter-13.pdf#page=4) |
| §13.3 REINFORCE: Monte Carlo Policy Gradient | [p. 6](../reference/level-3/sutton-barto-chapter-13.pdf#page=6) |
| §13.4 REINFORCE with Baseline | [p. 9](../reference/level-3/sutton-barto-chapter-13.pdf#page=9) |
| CartPole dynamics (not in the book) | https://gymnasium.farama.org/environments/classic_control/cart_pole/ |

## Prerequisites

Reference: none in the book. Welford's method is a numerically stable running
variance; the hand fixture is the TDD plan's 0.7.

- [ ] **L3.0aR** `test/core/stats.test.js` — Welford on `[2,4,4,4,5,5,7,9]` →
      mean 5, **population** std 2, named in the test *[TDD 0.7]*
- [ ] **L3.0aG** `core/stats.js` — `RunningStats` with `push`, `mean`, `std`
- [ ] **L3.0bR** `test/core/rng.test.js` — `categorical([0.2,0.3,0.5])` with
      scripted `u = 0.1, 0.4, 0.9` → `0, 1, 2` *[TDD 0.4]*
- [ ] **L3.0bG** `core/rng.js` and `test/helpers/mockRng.js` — `categorical(p)`
      (two bites if both need code: `L3.0bGa` rng, `L3.0bGb` mock)

## Phase A — environment (before any learning code)

Reference: Gymnasium CartPole source (port line for line; do not derive).
Test file `test/env/cartpole.test.js`; code `env/cartpole.js`.

**Integrator note:** the TDD golden fixture (`x′ = 0` after one step) is
**explicit Euler**, which is Gym's default `kinematics_integrator = "euler"`:
position uses the *old* velocity. Framework §3 says "semi-implicit"; follow
the fixture and Gym.

- [ ] **L3.1R** Golden step from `[0,0,0,0]`, action 1 → `ẋ′ = 0.19512195122`,
      `θ̇′ = −0.29268292683` *[TDD 3.1]*
- [ ] **L3.1Ga** Constants (`g, m_c, m_p, ℓ, F, τ`) from `params` and a `state` field
- [ ] **L3.1Gb** `step`: force sign from action, the `temp` term
- [ ] **L3.1Gc** `step`: `θ̈` and `ẍ` from the framework equations
- [ ] **L3.1Gd** `step`: Euler update and the returned `obs`. Observe: green.
- [ ] **L3.2R** Second step from the L3.1 state, expected values computed by
      hand on paper *[TDD 3.2]*. Observe: green, or a hand-arithmetic slip to find.
- [ ] **L3.3** Action 0 from a mirrored state gives the exact negation *[TDD 3.3]*. Observe: green.
- [ ] **L3.4R** `|x| > 2.4` → `terminated` *[TDD 3.4]*
- [ ] **L3.4G** Termination on `x`
- [ ] **L3.5R** `|θ| > 0.2094395102` → `terminated` *[TDD 3.5]*
- [ ] **L3.5G** Termination on `θ`
- [ ] **L3.6R** Reward `+1` on every non-terminal step; `maxSteps = 500` →
      `truncated` *[TDD 3.6]*
- [ ] **L3.6G** Reward and time limit
- [ ] **L3.7R** `reset(rng)` draws 4 values in `[−0.05, 0.05]` *[TDD 3.7]*
- [ ] **L3.7G** `reset` using `rng.uniform`
- [ ] **L3.8** Doubling `g` roughly doubles initial `θ̈` from a tilted, zero-force-term
      state *[TDD 3.8]*. Observe: green, or a param that isn't read live.
- [ ] **L3.9a** `test/fixtures/make_cartpole_fixture.py` — fixed action list,
      200 steps, dump `initialState`, `actions`, `states` to
      `cartpole_trajectory.json`. Run with
      `~/.local/bin/uv run --no-project --with gymnasium python …` (isolated; no global pip).
      Observe: the JSON file exists and has 200 states.
- [ ] **L3.9bR** `test/env/cartpole.test.js` — matches Python to 1e-9 over 200
      steps *[TDD 3.9]*. Observe: green. If red, the first diverging step names the bug.
- [ ] **L3.10R** Hand-coded controller (push toward the pole's lean) survives
      longer on average than a uniform random policy over 20 seeded episodes
- [ ] **L3.10G** Observe green; fix the env, not the test.

## Phase B — returns and the `nn/` façade

Reference: §13.3 [p. 6](../reference/level-3/sutton-barto-chapter-13.pdf#page=6)
(return `G_t` in the REINFORCE update) and §13.1
[p. 2](../reference/level-3/sutton-barto-chapter-13.pdf#page=2) (softmax policy).

- [ ] **L3.11R** `test/agent/lib/returns.test.js` — `[1,1,1]`, `γ = 0.9` →
      `[2.71, 1.9, 1]` *[TDD 3.10]*
- [ ] **L3.11G** `agent/lib/returns.js` — `discountedReturns` as a backward pass
- [ ] **L3.12** `γ = 0` → rewards; `γ = 1` → suffix sums `[3,2,1]` *[TDD 3.11, 3.12]*. Observe: green.
- [ ] **L3.13R** A `dones` array stops the sum at episode boundaries *[TDD 3.13]*
- [ ] **L3.13G** Reset the running return on `done`
- [ ] **L3.14a** `package.json` — add `@tensorflow/tfjs`. Observe: `import * as tf`
      works in a test (`tf.tensor([1]).shape`).
- [ ] **L3.14bR** `test/nn/mlp.test.js` — `mlp(4, [16], 2)` maps a `[1,4]` input to `[1,2]`
- [ ] **L3.14bG** `nn/mlp.js` — layers, activation, a `params` list. No TF.js call leaves `nn/`.
- [ ] **L3.15R** `test/nn/heads.test.js` — softmax probs sum to 1, all > 0 *[TDD 3.14]*
- [ ] **L3.15G** `nn/heads.js` — `categoricalHead(logits)` → `{ probs, sample, logProb, entropy }`
- [ ] **L3.16R** `logProb(a)` equals `log(probs[a])` *[TDD 3.15]*
- [ ] **L3.16G** `logProb` via log-softmax (not `log(softmax)`)
- [ ] **L3.17R** Entropy at uniform = `log 2 = 0.693147`; → < 1e-6 as logits diverge *[TDD 3.16, 3.17]*
- [ ] **L3.17G** `entropy`
- [ ] **L3.18R** `sample(rng)` uses `rng.categorical`; `deterministic` ignores the
      RNG and returns argmax *[TDD 3.19]*
- [ ] **L3.18G** Sampling through the project RNG, never `tf.multinomial`
- [ ] **L3.19R** `test/nn/optim.test.js` — Adam on `(w − 3)²` from `w = 0`:
      after 200 steps `|w − 3| < 0.05`
- [ ] **L3.19G** `nn/optim.js` — `adam(params, lr)` with `tf.variableGrads`

## Phase C — REINFORCE agent

Reference: §13.3 [p. 6](../reference/level-3/sutton-barto-chapter-13.pdf#page=6)
(the REINFORCE box), §13.4 [p. 9](../reference/level-3/sutton-barto-chapter-13.pdf#page=9)
(baseline). **Differs from the book:** the book's baseline is a learned
`v̂(s,w)`; this level uses the episode's mean return. A learned value is Level 4.
Test file `test/agent/reinforce.test.js`; code `agent/reinforce.js`.

- [ ] **L3.20R** `act(obs)` returns `{ action, logProb }` with action ∈ {0,1}
- [ ] **L3.20G** `act` through `mlp` + `categoricalHead`
- [ ] **L3.21R** `observe` ×3 then `update()` on a non-final step returns `{}`
- [ ] **L3.21G** Episode buffer; update only at episode end
- [ ] **L3.22R** With a 1-step episode and a fixed seed, one update raises
      `π(a_taken)` when the return is positive and lowers it when negative
- [ ] **L3.22Ga** Loss `−Σ log π(a_t|s_t) · G_t`
- [ ] **L3.22Gb** Apply with `adam`; return `{ loss, ret }`
- [ ] **L3.23** Baseline toggle: subtract the mean return. Observe: L3.22 still green.
- [ ] **L3.24R** With a large `β`, several updates on a one-sided return keep
      `π(a)` near 0.5
- [ ] **L3.24G** Entropy bonus `−β·H(π)` added to the loss
- [ ] **L3.25R** `save()/load()` → identical next action with the same seed *[TDD 3.21]*
- [ ] **L3.25G** `save` / `load` of weights
- [ ] **L3.26R** Frozen policy, 200 episodes: gradient-estimate variance with
      baseline < without *[TDD 3.20]*
- [ ] **L3.26G** `gradEstimate(episode, { baseline })` helper returning a flat vector
- [ ] **L3.27R** `test/slow/l3.slow.test.js` — mean return ≥ 195 over 100
      episodes *[TDD 3.22]*. Observe with `npm run test:slow`.
- [ ] **L3.27G** Observe green. If red, find the Tier 0 gap first.

## Site: `/l3`

Reference: §13.4 [p. 9](../reference/level-3/sutton-barto-chapter-13.pdf#page=9)
(Figure 13.2, baseline vs no baseline; render the page to describe it).

- [ ] **L3.28** `site/levels.js` — L3 page and tests. Observe: slot 3 is live; `/tests` has L3.
- [ ] **L3.29** `env/cartpole.js` — `render(ctx, state)` draws cart and pole. Observe: the pole on `/l3`.
- [ ] **L3.30** `runner/worker.js` — train REINFORCE headless; send `envState` for one
      rendered env at 60 Hz while training runs faster. Observe: the step counter outpaces frames.
- [ ] **L3.31** `pages/L3.jsx` — live `π(a|s)` bars. Observe: they swing with the pole.
- [ ] **L3.32** `pages/L3.jsx` — episode return curve. Observe: it climbs toward 500.
- [ ] **L3.33** `pages/L3.jsx` — physics sliders (`ℓ`, `m_p`, `g`, `F`) via
      `setParam`. Observe: a longer pole visibly changes the swing and the return dips.
- [ ] **L3.34** `pages/L3.jsx` — learning sliders (hidden width, `lr`, `γ`, `β`, baseline).
      Observe: the equation panel shows `b(s_t)` only when baseline is on.
- [ ] **L3.35** `pages/L3.jsx` — gradient-variance panel, baseline ON vs OFF side by side.
      Observe: the ON line sits lower. This is the level's payoff.

## Current bite

**Active:** — (starts when Level 2 is complete)  
**Status:** not started
