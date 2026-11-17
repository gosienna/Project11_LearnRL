# Level 4 — Bite checklist (PPO on car racing)

Progress tracker for instructor mode. Rules for R/G bites, paths, and splitting
are in [README.md](README.md#bite-rules-all-levels).

Concept: actor-critic, generalized advantage estimation, a clipped trust
region, continuous `[steer, throttle]` actions, and parallel envs. It is also
the first level where the learner *causes* reward hacking.

New shared code: `Box`, `gaussianHead`, `core/buffer.js` (push / drain),
`agent/lib/gae.js`, `agent/lib/losses.js`, `env/vec.js`. This is the largest
level; expect more bites per milestone.

## Read first

`reference/level-4/README.md`, in this order:

1. Huang et al., *The 37 Implementation Details of PPO*: the 13 core details
   and the continuous-action section. **Read before L4.30.**
2. Schulman et al. 2017, *PPO*: the clip objective and the algorithm box.
3. OpenAI Spinning Up, PPO; Schulman et al. 2015 for GAE if `λ` is unclear.

Book sections that bridge from Level 3 (ch. 13 extract in `reference/level-3/`):

| Section | Link |
|---------|------|
| §13.5 Actor–Critic Methods | [p. 11](../reference/level-3/sutton-barto-chapter-13.pdf#page=11) |
| §13.7 Policy Parameterization for Continuous Actions | [p. 15](../reference/level-3/sutton-barto-chapter-13.pdf#page=15) |

Tests follow [rl-web-tdd-plan.md](rl-web-tdd-plan.md) §5. The demo follows
[rl-web-framework.md](rl-web-framework.md) Level 4.

## Prerequisites

Reference: §13.7 [p. 15](../reference/level-3/sutton-barto-chapter-13.pdf#page=15)
(Gaussian policy with mean and standard deviation).

- [ ] **L4.0aR** `test/core/spaces.test.js` — `Box([-1,-1],[1,1]).contains([0,2])`
      false, `sample` stays inside *[TDD 0.6]*
- [ ] **L4.0aG** `core/spaces.js` — `Box(low, high)`
- [ ] **L4.0bR** `test/nn/heads.test.js` — Gaussian `logProb(0 | μ=0, σ=1)` =
      `−0.91893853320`; entropy at σ=1 = `1.41893853320` *[TDD 3.18]*
- [ ] **L4.0bG** `nn/heads.js` — `gaussianHead(mu, logStd)`; sample with `rng.normal`
- [ ] **L4.0cR** `test/core/buffer.test.js` — cap 3, push 5 → `[3,4,5]`, `size === 3`;
      `drain()` returns them in order and empties *[TDD 0.8]*
- [ ] **L4.0cG** `core/buffer.js` — ring over flat `Float32Array`s, `push`, `drain`

## Phase A — GAE and losses (pure functions, before any agent)

Reference: Spinning Up PPO (advantage section), PPO paper eq. 7 (clip).
Tests in `test/agent/lib/`; code in `agent/lib/gae.js` and `agent/lib/losses.js`.

- [ ] **L4.1R** GAE 3-step fixture → `[3.08788445, 2.120026, 1.092]` *[TDD 4.1]*
- [ ] **L4.1G** `gae(rewards, values, lastValue, dones, γ, λ)` as a backward pass
- [ ] **L4.2R** `λ = 1` equals Monte-Carlo `G₀ − V(s₀) = 3.2463392` to 1e-10 *[TDD 4.2]*
- [ ] **L4.2G** Observe green; if red, the value offset is off by one
- [ ] **L4.3** `λ = 0` equals one-step TD `δ₀ = 1.094` *[TDD 4.3]*. Observe: green.
- [ ] **L4.4R** A `done` mid-rollout stops bootstrap and the trace *[TDD 4.4]*
- [ ] **L4.4G** Mask both `V(s_{t+1})` and the running advantage with `1 − done`
- [ ] **L4.5R** `clipLoss(1.3, +2, 0.2)` = `−2.4` *[TDD 4.5]*
- [ ] **L4.5G** `clipLoss` as `−min(r·A, clip(r)·A)`
- [ ] **L4.6R** `clipLoss(1.3, −2, 0.2)` = `+2.6` *[TDD 4.6]*. Observe: green;
      red means the ratio was clipped before the `min`.
- [ ] **L4.7** `ratio = 1` → `−adv` exactly *[TDD 4.7]*. Observe: green.
- [ ] **L4.8R** `clipfrac([0.9, 1.0, 1.25, 0.75], 0.2)` = `0.5` *[TDD 4.8]*
- [ ] **L4.8G** `clipfrac`
- [ ] **L4.9R** `approxKL` k3 at logratio 0 = 0; ≥ 0 for 1000 seeded logratios *[TDD 4.9, 4.10]*
- [ ] **L4.9G** `approxKL` = mean of `(e^x − 1) − x`
- [ ] **L4.10R** Normalize `[1, 2, 3]` → mean 0, std 1 *[TDD 4.11]*
- [ ] **L4.10G** `normalize` (reuse the population-std choice from L3.0a)
- [ ] **L4.11R** Explained variance of a perfect predictor = 1.0 *[TDD 4.12]*
- [ ] **L4.11G** `explainedVariance(pred, target)`

## Phase B — racer environment

Reference: not in the book. Bicycle model and raycasts are framework Level 4;
do not use Box2D or Matter.js.
Test file `test/env/racer.test.js`; code `env/racer.js` (split into
`env/track.js` if it passes ~150 lines).

- [ ] **L4.12R** A track from an oval centerline polyline + half-width gives
      left and right edge polylines of the same length
- [ ] **L4.12G** Track representation: centerline, cumulative arc length, edges
- [ ] **L4.13R** Raycast to a straight wall at distance 1 → `1.0` *[TDD 4.13]*
- [ ] **L4.13Ga** Ray–segment intersection helper
- [ ] **L4.13Gb** `raycast(pos, angle, segments, maxRange)` → nearest hit
- [ ] **L4.14** No hit within range → `maxRange` *[TDD 4.14]*. Observe: green.
- [ ] **L4.15** 45° to a wall at distance 1 → `√2` *[TDD 4.15]*. Observe: green.
- [ ] **L4.16R** Zero throttle, zero steer from rest → no position change *[TDD 4.16]*
- [ ] **L4.16G** Kinematic bicycle step (position, heading, speed)
- [ ] **L4.17R** Full left vs. full right from the same state → mirrored heading *[TDD 4.17]*
- [ ] **L4.17G** Observe green; fix the steer sign inside this bite if not
- [ ] **L4.18R** Straight-line drive gives progress reward `Δs` along the centerline *[TDD 4.18]*
- [ ] **L4.18G** Project the position onto the centerline; reward = signed `Δs`
- [ ] **L4.19** **Backwards motion → negative progress** *[TDD 4.19]*. Observe: green.
      This is the reward-hacking guard.
- [ ] **L4.20R** Off-track → `terminated` *[TDD 4.20]*
- [ ] **L4.20G** Lateral offset > half-width terminates
- [ ] **L4.21R** Actions outside `[−1, 1]` are clamped *[TDD 4.21]*
- [ ] **L4.21G** Clamp in `step`
- [ ] **L4.22R** `obs` has 12 dims: 9 rays, speed, heading error, lateral offset
- [ ] **L4.22G** Assemble `obs`
- [ ] **L4.23R** A sharp turn at speed ends farther out with grip 0.5 than with grip 1
- [ ] **L4.23G** Slip: lateral velocity decays by the grip factor. Observe: L4.16–L4.17 still green.
- [ ] **L4.24R** Hand-coded controller (steer toward the centerline tangent,
      fixed throttle) completes one oval lap headless
- [ ] **L4.24G** Observe green. Fix the env before any agent code.

## Phase C — vectorization

Reference: framework §2.3 (`env/vec.js`). Test file `test/env/vec.test.js`.

- [ ] **L4.25R** `VecEnv(8)` steps all 8 → obs shape `[8, 12]` *[TDD 4.22]*
- [ ] **L4.25G** `env/vec.js` — `clone()` N envs, each with its own seeded RNG
- [ ] **L4.26R** A terminated env auto-resets: fresh obs, flag set *[TDD 4.23]*
- [ ] **L4.26G** Auto-reset, keeping the final obs in `info`
- [ ] **L4.27R** `VecEnv(8)` ≡ 8 sequential envs, same seeds, exact *[TDD 4.24]*
- [ ] **L4.27G** Observe green; red means a stale obs or a double step

## Phase D — PPO agent

Reference: *37 details* (read now), Spinning Up PPO pseudocode, PPO algorithm box.
Test file `test/agent/ppo.test.js`; code `agent/ppo.js` unless named.

- [ ] **L4.28R** `test/nn/mlp.test.js` — orthogonal init: hidden `W·Wᵀ ≈ 2·I`
      (`sqrt(2)` gain); policy head gain 0.01
- [ ] **L4.28G** `nn/mlp.js` — `init: 'orthogonal'` with a gain option
- [ ] **L4.29R** `act(obs)` returns `{ action, logProb, value }`; action in `[−1,1]²` after clamp
- [ ] **L4.29G** Separate actor and critic `mlp(12, [64,64], …)`, state-independent `logStd`
- [ ] **L4.30R** Observation normalization: after 1000 observes, normalized obs
      mean ≈ 0, std ≈ 1 per dim
- [ ] **L4.30G** Per-dim `RunningStats` applied in `act`
- [ ] **L4.31R** Rollout buffer after `T` steps × `N` envs has `T·N` rows *[TDD 4.25]*
- [ ] **L4.31G** `observe` pushes into `core/buffer.js`; `update()` returns `{}` until full
- [ ] **L4.32R** First minibatch of epoch 1: ratio is exactly 1, so `clipfrac = 0` and `approxKL = 0`
- [ ] **L4.32Ga** `update`: GAE over the drained rollout, returns = adv + values
- [ ] **L4.32Gb** `update`: shuffle with the agent `rng`, minibatches, K epochs
- [ ] **L4.32Gc** `update`: loss = clip + `vf`·value loss − `ent`·entropy; per-minibatch adv normalization
- [ ] **L4.32Gd** `update`: return `{ approxKL, clipfrac, explainedVar, … }`
- [ ] **L4.33a** Value-loss clipping (*37 details* #9). Observe: L4.32 still green.
- [ ] **L4.33b** Linear lr annealing. Observe: `lr` in the returned metrics falls each update.
- [ ] **L4.34R** `setParam` mid-run (clip ε) changes the next update's clipfrac *[TDD 4.26]*
- [ ] **L4.34G** Read hyperparameters live from the schema each update
- [ ] **L4.35R** `save()/load()` → identical next action *[TDD 4.27]*
- [ ] **L4.35G** Save weights, `logStd`, and obs-normalizer state
- [ ] **L4.36R** `test/slow/l4.slow.test.js` — completes a lap on the oval in
      < 5 min *[TDD 4.28]*. Observe with `npm run test:slow`.
- [ ] **L4.36G** Observe green. If red, re-check the *37 details* list before tuning.

## Site: `/l4`

Reference: PPO paper Figure 1 (the clip shape) for L4.41; *37 details* for diagnostics.

- [ ] **L4.37** `site/levels.js` — L4 page and tests. Observe: slot 4 is live.
- [ ] **L4.38** `env/racer.js` — `render(ctx, state)`: track, car, rays. Observe: rays shorten near walls.
- [ ] **L4.39** `pages/L4.jsx` — track editor: click to place centerline points.
      Observe: a closed track appears and `reset` puts the car on it.
- [ ] **L4.40** `runner/worker.js` — train with `VecEnv`, render env 0 only. Observe: lap time falls.
- [ ] **L4.41** `pages/L4.jsx` — ratio histogram with the `[1−ε, 1+ε]` band. Observe:
      shrinking ε puts more mass outside the band.
- [ ] **L4.42** `pages/L4.jsx` — `approxKL`, `clipfrac`, explained variance charts.
      Observe: EV climbs toward 1 as the critic learns.
- [ ] **L4.43** `pages/L4.jsx` — advantages before / after normalization.
      Observe: the after-histogram centres on 0.
- [ ] **L4.44** `pages/L4.jsx` — reward editor (text → closure in the worker).
      Observe: a syntax error shows a message, not a crash.
- [ ] **L4.45** `pages/L4.jsx` — reward-hacking presets: raw velocity → circles;
      undirected checkpoints → oscillation. Observe: each emerges within a minute.
- [ ] **L4.46** `pages/L4.jsx` — train on track A, **Evaluate on B**. Observe:
      returns drop on B. This is the generalization lesson.
- [ ] **L4.47** `runner/` — split `VecEnv` across 2+ workers. Observe: steps/s rises.

## Current bite

**Active:** — (starts when Level 3 is complete)  
**Status:** not started
