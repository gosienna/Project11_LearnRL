# Level 5 — Bite checklist (adaptive opponent, human in the loop)

Progress tracker for instructor mode. Rules for R/G bites, paths, and splitting
are in [README.md](README.md#bite-rules-all-levels).

Concept: off-policy replay, non-stationarity, opponent modelling, and
difficulty targeting. The game is pursuit–evasion: the human is the
predator (mouse or touch), the agent learns to escape.

New shared code: `core/buffer.js` gains `sample`; `agent/lib/targets.js`
(SAC target, Polyak); the tanh correction in `nn/heads.js`; a `humanAction`
message in `runner/protocol.js`. Human-input handling stays inside L5's
env, page, and worker branch, not in `core/` (framework §2.7).

## Read first

`reference/level-5/README.md`, in this order:

1. OpenAI Spinning Up, *Soft Actor-Critic*: replay, twin Q, entropy term,
   tanh squashing. Paper: Haarnoja et al. 2018.
2. He et al. 2016, *Opponent Modeling in Deep RL*: architecture and the
   non-stationary-opponent experiments.
3. Papoudakis et al. 2019: problem statement and opponent-modelling section.
4. *Deep RL in Action* §§3.3–3.4 (experience replay, target network) and §10.5
   (double Q-learning): the DQN versions of the replay buffer, target critics,
   and twin-Q `min`. §9.1 and §9.5 cover what changes when another agent is in
   the environment.
5. Sutton & Barto §11.3, *The Deadly Triad* (local extract): function
   approximation + bootstrapping + off-policy data. Replay buffers and target
   networks exist to tame this combination.

The book's §6.7 *Maximization Bias and Double Learning*
([ch. 6 p. 16](../reference/level-2/sutton-barto-chapter-6.pdf#page=16)) is the tabular root of
the twin-Q `min`.

### Page map

Sutton & Barto ch. 11 extract page = book PDF page − 278.

| Section | Link |
|---------|------|
| §6.7 Maximization Bias and Double Learning | [ch. 6 p. 16](../reference/level-2/sutton-barto-chapter-6.pdf#page=16) |
| §11.3 The Deadly Triad | [ch. 11 p. 8](../reference/level-5/sutton-barto-chapter-11.pdf#page=8) |
| §16.5 Human-level Video Game Play (DQN replay, target net) | [§16.5 p. 1](../reference/level-3/sutton-barto-section-16-5.pdf#page=1) |

*Deep RL in Action* (local full book, gitignored; PDF page = printed page + 22):

| Section | Link |
|---------|------|
| §3.3 Experience replay | [p. 97](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=97) |
| §3.4 Improving stability with a target network | [p. 102](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=102) |
| §9.1 From one to many agents | [p. 266](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=266) |
| §9.5 Mixed cooperative-competitive games | [p. 293](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=293) |
| §10.5 Double Q-learning | [p. 339](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=339) |

Tests follow [rl-web-tdd-plan.md](rl-web-tdd-plan.md) §6.
The demo follows [rl-web-framework.md](rl-web-framework.md) Level 5.

## Phase A — replay buffer

Reference: Spinning Up SAC ("replay buffer" in the pseudocode). Test file
`test/core/buffer.test.js`; code `core/buffer.js` (extends L4's ring).
*Deep RL in Action* §3.3
[p. 97](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=97)
explains why random minibatches from replay prevent catastrophic forgetting.
The book uses a Python `deque` with `random.sample`; here sampling goes through
the project RNG so the L5.3 fixture is exact.

- [ ] **L5.1** Capacity: push 5 into cap 3 → `size === 3`, last 3 *[TDD 5.1]*.
      Observe: green from L4.0c.
- [ ] **L5.2R** Overwrite is FIFO, exact contents after wraparound *[TDD 5.2]*
- [ ] **L5.2G** Observe green, or fix the write index
- [ ] **L5.3R** `sample(2, mockRng)` with scripted `int` draws → exact items *[TDD 0.9, 5.3]*
- [ ] **L5.3G** `sample(n, rng)` draws indices with `rng.int(size)`
- [ ] **L5.4R** Sampling an under-full buffer never returns `undefined` *[TDD 5.4]*
- [ ] **L5.4G** Draw from `size`, not `capacity`
- [ ] **L5.5R** `(s, a, r, s′, done)` stay aligned across wraparound *[TDD 5.5]*
- [ ] **L5.5G** One write index shared by every field array

## Phase A — SAC targets and squashing

Reference: Spinning Up SAC, the "Learning Q" and "Learning the Policy"
sections. Tests `test/agent/lib/targets.test.js`, `test/nn/heads.test.js`.
Twin-Q `min` (L5.8): *Deep RL in Action* §10.5
[p. 339](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=339)
and Sutton & Barto §6.7 (overestimation from a single `max`). Polyak (L5.10–L5.11):
*Deep RL in Action* §3.4
[p. 102](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=102)
and Sutton & Barto §11.3
[ch. 11 p. 8](../reference/level-5/sutton-barto-chapter-11.pdf#page=8).
**Differs from the book:** *Deep RL in Action* copies the online network into
the target every `sync_freq` steps (a hard copy, which is `τ = 1` on a schedule).
SAC moves the target a fraction `τ` toward the online network on every step.

- [ ] **L5.6R** SAC target: `r=1, γ=0.99, Q̄=[2.0,1.5], α=0.2, log π=−0.5` → `2.584` *[TDD 5.6]*
- [ ] **L5.6G** `agent/lib/targets.js` — `sacTarget(r, done, q1, q2, logPi, γ, α)`
- [ ] **L5.7** Terminal → `r` only *[TDD 5.7]*. Observe: green, or add the `done` mask.
- [ ] **L5.8** Twin critic takes the **min**, not the mean *[TDD 5.8]*. Observe: green.
- [ ] **L5.9** `α = 0` reduces to the TD3 form *[TDD 5.9]*. Observe: green.
- [ ] **L5.10R** Polyak: `θ̄=1, θ=0, τ=0.1` → `0.9` *[TDD 5.10]*
- [ ] **L5.10G** `polyakUpdate(target, online, τ)` with `θ̄ ← τθ + (1−τ)θ̄`
- [ ] **L5.11** `τ = 1` copies; `τ = 0` freezes *[TDD 5.11, 5.12]*. Observe: green.
      This pins the convention.
- [ ] **L5.12R** tanh correction at `u = 1`: squashed log-prob is **larger** by
      `0.86756170` *[TDD 5.13]*
- [ ] **L5.12G** `nn/heads.js` — `gaussianHead(…, { squash: true })` subtracts `Σ log(1 − tanh²u)`
- [ ] **L5.13R** Squashed actions strictly within `(−1, 1)` over 10⁴ samples *[TDD 5.14]*
- [ ] **L5.13G** Add an epsilon inside the log; observe no `NaN` and green

## Phase B — pursuit environment

Reference: not in the book (framework Level 5). Test file
`test/env/pursuit.test.js`; code `env/pursuit.js`.

**Win rule:** capture (distance < radius) → `terminated`. Surviving to the
time limit → `truncated`, which **bootstraps** (the L2.15–L2.16 rule).

- [ ] **L5.14R** `reset(rng)` places pursuer and evader in the arena, at least
      a minimum distance apart
- [ ] **L5.14G** Two point masses, arena bounds, `reset`
- [ ] **L5.15R** `step({ agent, human })` with fixed actions moves both by `v·dt`, clamped to walls
- [ ] **L5.15G** Integrate both bodies
- [ ] **L5.16R** Capture → `terminated`; time limit → `truncated`, not terminated
- [ ] **L5.16G** Termination rules and reward (+1 per survived step, −10 on capture)
- [ ] **L5.17R** Scripted human input sequence → identical trajectory twice *[TDD 5.15]*
- [ ] **L5.17G** Observe green; human actions come only from the input, never from `rng`
- [ ] **L5.18R** Scripted pursuer (straight chase) catches a stationary evader;
      a scripted evader (flee directly away) survives longer
- [ ] **L5.18G** `scripted.js` helpers in `env/`. Observe: green.

## Phase C — SAC agent

Reference: Spinning Up SAC pseudocode. Test file `test/agent/sac.test.js`;
code `agent/sac.js`.

- [ ] **L5.19R** `act(obs)` → action in `(−1, 1)²`; `deterministic` returns `tanh(μ)`
- [ ] **L5.19G** Actor `mlp` + squashed `gaussianHead`
- [ ] **L5.20R** Two critics and two target critics; targets start equal to online
- [ ] **L5.20G** Build critics; copy with `polyakUpdate(…, 1)`
- [ ] **L5.21R** `update()` returns `{}` until the buffer holds `batchSize`
- [ ] **L5.21G** `observe` → buffer; `update` guard
- [ ] **L5.22Ra** Critic step on a one-transition batch moves `Q(s,a)` toward `sacTarget`
- [ ] **L5.22Ga** Critic loss and step
- [ ] **L5.22Rb** Actor step raises `min Q(s, ã) − α log π(ã|s)` on that batch
- [ ] **L5.22Gb** Actor loss and step, then Polyak on both targets
- [ ] **L5.23** Replay ratio: `updatesPerStep` from the schema. Observe: a counter
      shows each transition sampled many times on average.
- [ ] **L5.24R** `test/slow/l5.slow.test.js` — vs. the scripted pursuer, mean
      survival time after 3 simulated minutes beats the first minute *[TDD 5.21]*
- [ ] **L5.24G** Observe green on `npm run test:slow`. Tune for **early** improvement.

## Phase D — opponent model and difficulty

Reference: He et al. 2016 (opponent network trained by supervised learning);
Papoudakis et al. (why the opponent's policy is non-stationary).
*Deep RL in Action* §9.1
[p. 266](../reference/Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=266)
shows why another acting agent makes the environment non-stationary.

- [ ] **L5.25R** `test/agent/opponent.test.js` — human action → one of 9 classes
      (8 directions + still)
- [ ] **L5.25G** `agent/opponent.js` — `toClass(humanAction)`
- [ ] **L5.26R** Constant human action → accuracy > 0.95 after N updates *[TDD 5.16]*
- [ ] **L5.26G** Small classifier `p̂(aʰ|s)` with cross-entropy, through `nn/`
- [ ] **L5.27R** Uniform-random human → accuracy ≈ 1/9 *[TDD 5.17]*. Observe: if this
      is also high, the model is leaking (e.g. it sees the current action in `s`).
- [ ] **L5.27G** Observe green; fix the features, not the threshold
- [ ] **L5.28R** `test/agent/difficulty.test.js` — `ρ̂` is the **agent's** win
      rate. `τ=1, η=0.1, ρ̂=0.8, ρ*=0.5` → `τ = 1.03` (agent too strong → more random) *[TDD 5.18]*
- [ ] **L5.28G** `agent/difficulty.js` — `τ ← τ + η(ρ̂ − ρ*)`, clamped
- [ ] **L5.29R** Fed a win-rate that reacts to `τ`, the controller stays bounded
      over 1000 steps *[TDD 5.19]*
- [ ] **L5.29G** Smooth `ρ̂` with an EMA; observe no oscillation

## Site: `/l5`

Reference: Spinning Up SAC (the replay buffer that the strip shows).

- [ ] **L5.30** `runner/protocol.js` — add `humanAction`. Observe: the type list includes it.
- [ ] **L5.31** `site/levels.js` — L5 page and tests. Observe: all five slots live; `/tests` runs everything.
- [ ] **L5.32** `env/pursuit.js` — `render(ctx, state)`. Observe: two dots on `/l5`.
- [ ] **L5.33** `pages/L5.jsx` — mouse/touch → `humanAction` each frame. Observe: your dot follows the pointer.
- [ ] **L5.34** `runner/worker.js` — train while the human plays; keep the latest
      `humanAction`; learning continues when rendering pauses *[TDD 5.20]*.
      Observe: the update counter rises with the tab in the background.
- [ ] **L5.35** `pages/L5.jsx` — replay buffer strip, sampled transitions highlighted.
      Observe: old transitions keep lighting up.
- [ ] **L5.36** `pages/L5.jsx` — ghost overlay of `p̂(aʰ|s)` and an accuracy chart.
      Observe: the ghost leans where you are about to go.
- [ ] **L5.37** `pages/L5.jsx` — win-rate trace with adaptation markers. Observe:
      an exploit works, then stops working.
- [ ] **L5.38** `pages/L5.jsx` — target `ρ*` slider driving `τ`. Observe: win rate settles near it.
- [ ] **L5.39** `runner/worker.js` — **Warm start**: headless self-play vs. the
      scripted pursuer, then human fine-tuning. Observe: improvement visible within 2–3 minutes of play.

## Current bite

**Active:** — (starts when Level 4 is complete)  
**Status:** not started
