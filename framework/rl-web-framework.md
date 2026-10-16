# Interactive Reinforcement Learning on the Web — Framework & Implementation Plan

A five-level progression of browser-native RL demos that train live, with every
equation, input, and internal signal exposed for the user to manipulate.

---

## 1. The Ladder

Each level introduces exactly one new concept over the one below it. Nothing is
repeated for its own sake.

| # | Example | New concept | Deep RL? | Train time |
|---|---------|-------------|----------|------------|
| 1 | k-armed bandit | Exploration vs. exploitation | No | Instant |
| 2 | Gridworld Q-learning (Cliff Walking) | State, transitions, TD bootstrapping | No (tabular) | Seconds |
| 3 | REINFORCE on CartPole | Function approximation, policy gradients | Yes (minimally) | 20–60 s |
| 4 | PPO on car racing | Actor-critic, GAE, continuous control | Yes | 2–10 min |
| 5 | Adaptive opponent (pursuit/air hockey) | Off-policy replay, non-stationarity, human-in-the-loop | Yes | Live, continuous |

**Design rule:** levels 1–2 are where the concepts are *legible* — the user can
see exactly why each update happened. Levels 3–5 are where they are *powerful*
but opaque. Keeping both halves is what makes the opaque half interpretable in
retrospect.

---

## 2. Shared Framework Architecture

Roughly 1,200 lines of shared code; 200–400 lines per example. Without sharing,
the same five demos cost ~4,000 lines and five divergent copies of the worker
protocol.

### 2.1 The parameter schema (build this first)

Every example has tunable knobs, and each knob must drive four separate things:
the slider UI, the equation panel bindings, the checkpoint format, and the
shareable reproduction URL. Declare each knob once.

```js
export const cartpoleSchema = {
  poleLength: { sym: '\\ell',   val: 0.5, min: 0.1, max: 2.0, unit: 'm' },
  gravity:    { sym: 'g',       val: 9.8, min: 1.0, max: 20.0 },
  lr:         { sym: '\\alpha', val: 1e-2, min: 1e-4, max: 1e-1, log: true },
  gamma:      { sym: '\\gamma', val: 0.99, min: 0.8, max: 1.0 },
};
```

Downstream, all four consumers are generated:

```js
buildControls(schema)   // slider panel
bindEquation(schema)    // live-bound KaTeX spans
serialize(schema)       // checkpoint + URL hash
applyPatch(schema, msg) // worker-side live updates
```

Adding a knob becomes a one-line change instead of four edits in four files.

### 2.2 `core/` — universal primitives

| File | Contents | Why shared |
|------|----------|------------|
| `rng.js` | Seeded PRNG (xorshift128+ / PCG32): `uniform()`, `normal()`, `categorical(p)` | Deterministic replay. **Never call `Math.random()` anywhere in the codebase.** |
| `spaces.js` | `Discrete(n)`, `Box(low, high, shape)` with `sample(rng)`, `contains(x)` | Lets one agent bind to multiple envs (~40 lines) |
| `buffer.js` | Ring buffer over flat `Float32Array`s, exposing both `drain()` and `sample(n, rng)` | Trajectory buffer for L3–L4, replay buffer for L5 — same storage, two access patterns |
| `stats.js` | Welford running mean/std | Observation and advantage normalization; needed from L3 up |

### 2.3 `env/` — one interface, five implementations

```js
{
  obsSpace, actSpace, params,
  reset(rng)      -> obs,
  step(action)    -> { obs, reward, terminated, truncated, info },
  render(ctx, st),              // canvas draw — reads state, never advances it
  clone()                       // for vectorization
}
```

Two rules make this genuinely reusable:

- **`terminated` ≠ `truncated`.** A pole that fell is not a time limit reached.
  Bootstrapping the value function is correct for one and wrong for the other.
  Gym learned this the hard way — inherit the fix.
- **`render` is pure.** It reads state and draws; it never steps the sim. That
  separation is what lets you train headless at 10,000× while rendering at 60 Hz.

`env/vec.js` wraps N envs with auto-reset. L4 gets parallelism free; L1/L2/L5
just run with N=1.

### 2.4 `nn/` — a thin façade over TensorFlow.js

Not a neural net library — a ~100-line adapter so agents never call TF.js
directly:

```js
mlp(inDim, hidden[], outDim, activation)
categoricalHead(logits)  -> { sample, logProb, entropy }
gaussianHead(mu, logStd) -> { sample, logProb, entropy }   // incl. tanh correction
adam(params, lr)
```

The two distribution heads are the real content: `logProb` and `entropy` appear
in L3, L4, and L5 with identical signatures. The façade is also an exit — if
TF.js proves too slow for L4, swap one file for hand-rolled WGSL and nothing
above changes.

### 2.5 `agent/` — deliberately thin, no base class

```js
{
  act(obs, { deterministic }) -> { action, logProb?, value? },
  observe(transition),
  update() -> metricsObject,   // returns {} when not ready to update
  save() / load()
}
```

**Each agent owns its own loop logic. Do not write an abstract `Agent` base
class.** Update cadences differ fundamentally — per-step, per-episode,
per-rollout, per-gradient-step — and an abstraction covering all four degrades
into a configuration language nobody can read. These files *are* the teaching
material; keep them readable.

Share *functions* instead:

```js
discountedReturns(rewards, γ)                 // L3
gae(rewards, values, dones, γ, λ)             // L4, L5
clipLoss(ratio, adv, ε)                       // L4
polyakUpdate(targetNet, onlineNet, τ)         // L5
approxKL(logRatio)                            // L4, L5 — k3 estimator
```

### 2.6 `runner/` — worker protocol

Training runs in a Web Worker; the main thread only renders.

```js
// main -> worker
{ type: 'start' | 'pause' | 'reset' | 'stepOnce' | 'setParam', key?, value? }

// worker -> main, throttled to ~10 Hz
{ type: 'telemetry', step, metrics: {...}, envState: Float32Array }
```

`setParam` is what makes live manipulation work — change ε mid-training without
restarting. **Throttle the flush.** `postMessage` at 30 kHz will kill the page;
accumulate in the worker and flush on a timer.

`runner/telemetry.js` on the main thread keeps a ring buffer per metric and
feeds both the charts and the equation spans. Every metric any example emits
travels one path.

### 2.7 What is deliberately NOT shared

- **Page layout.** L1 wants bars, L2 a grid, L4 a track editor. Share the
  *widgets* (`<Slider>`, `<LineChart>`, `<Histogram>`, `<EquationPanel>`); let
  each example compose its own page. A configurable universal layout would be
  worse than five bespoke ones.
- **Reward functions.** Keep inside each env. A shared reward abstraction sounds
  elegant and buys nothing.
- **Human input handling.** Only L5 needs it. Don't push it into `core`.

### 2.8 Repository layout

```
src/
  core/      rng.js  spaces.js  buffer.js  stats.js  schema.js
  nn/        mlp.js  heads.js  optim.js
  env/       bandit.js  gridworld.js  cartpole.js  racer.js  pursuit.js  vec.js
  agent/     bandit.js  tabular.js  reinforce.js  ppo.js  sac.js
  agent/lib/ returns.js  gae.js  losses.js  targets.js
  runner/    worker.js  protocol.js  telemetry.js
  ui/        Slider.jsx  LineChart.jsx  Histogram.jsx  EquationPanel.jsx
  pages/     L1.jsx  L2.jsx  L3.jsx  L4.jsx  L5.jsx
```

### 2.9 Cross-cutting requirements

- **Seeded everything.** One `rng` instance per env, one per agent, both seeded
  from a run seed shown in the UI.
- **Checkpointing.** IndexedDB, keyed by run seed + schema hash. Users save a
  trained policy and reload it.
- **Step mode.** Every level supports one-click-one-update, with the equation
  panel filled in with the literal numbers from that transition.
- **Headless verification.** Every env has a test that runs a hand-coded
  controller and asserts a known return. Environment bugs masquerading as
  algorithm bugs is the single largest time sink in RL.

---

## 3. Implementation Plans

### Level 1 — k-armed Bandit

**Goal:** the purest form of RL — action → reward, no state, no bootstrapping.
Also the vehicle for debugging the entire infrastructure.

**Equations on screen**

$$Q_{n+1}(a) = Q_n(a) + \alpha\big[R_n - Q_n(a)\big]$$

$$a_t = \begin{cases}\arg\max_a Q_t(a) & \text{prob } 1-\epsilon\\ \text{random} & \text{prob } \epsilon\end{cases}
\qquad\text{UCB toggle: } a_t = \arg\max_a\Big[Q_t(a) + c\sqrt{\tfrac{\ln t}{N_t(a)}}\Big]$$

**Environment** (~30 LOC). `k` arms, true means `μ[]`, noise `σ[]`. Optional
non-stationary mode: `μ_k ← μ_k + N(0, 0.01)` per step.

**Agent** (~40 LOC). `Q[]`, `N[]`. Step-size selector: constant `α` vs. sample
average `1/N`. Policy selector: ε-greedy / UCB / greedy.

**Parameter schema.** `k`, per-arm `μ_k` and `σ_k` (draggable on the plot),
`ε`, `α`, `c`, `nonstationary`, `seed`.

**Visualizations**
- Estimated `Q̂(a)` bars overlaid on ghost bars for true `μ_k`
- Pull counts `N(a)`
- Cumulative regret curve
- **Human mode:** the user pulls arms and is scored against the agent

**Milestones**
1. Env + agent headless, asserted to converge to the best arm
2. Worker + telemetry + charts (this is the real work — the algorithm is trivial)
3. Param schema driving sliders and equation bindings
4. Human mode
5. Non-stationary mode

**Acceptance:** with `ε=0.1`, `k=10`, `σ=1`, the agent reaches ≥80% optimal-arm
selection within 1,000 pulls. In non-stationary mode, constant `α` visibly beats
sample-average — this is the lesson.

**Pitfalls.** Don't skip the worker here because the algorithm is easy. The whole
point of building L1 first is to debug the infrastructure on a problem where you
already know the right answer.

---

### Level 2 — Tabular Q-learning on a Grid (Cliff Walking)

**Goal:** introduce state, transition, discounting, and bootstrapping while
keeping every learned value directly visible.

**Equations on screen**

$$Q(s,a) \leftarrow Q(s,a) + \alpha\big[\underbrace{r + \gamma \max_{a'} Q(s',a') - Q(s,a)}_{\delta_t}\big]$$

SARSA toggle replaces $\max_{a'} Q(s',a')$ with $Q(s',a')$ for the actually-taken
next action.

**Environment** (~80 LOC). Grid with paintable cell types (empty / wall / goal /
cliff / start), per-type reward values, optional slip probability for stochastic
transitions.

**Agent** (~60 LOC). `Q[nStates][nActions]` table. ε-greedy with decay schedule.

**Parameter schema.** Grid dims, per-cell-type reward, `α`, `γ`, `ε` and decay,
slip probability, algorithm (Q-learning / SARSA / Expected SARSA).

**Visualizations**
- `V(s) = max_a Q(s,a)` as a heatmap
- Greedy policy as arrows per cell
- Four-triangle per-cell Q display (one triangle per action)
- Episode return curve
- **Step mode:** one click = one update; the equation panel fills with that
  transition's literal numbers and `δ_t` flashes on the changed cell

**Milestones**
1. Env with paintable grid + slip
2. Q-learning agent, heatmap + arrow rendering
3. SARSA toggle
4. Step mode with live equation substitution
5. ε-decay schedules

**Acceptance:** on the standard Cliff Walking layout, Q-learning converges to
the optimal cliff-edge path and SARSA to the safe detour. **That single toggle
teaches on-policy vs. off-policy better than a chapter of text** — it is the
headline feature of this level, not a footnote.

**Pitfalls.** Don't let the grid get large; the four-triangle display stops being
readable past about 12×12.

---

### Level 3 — REINFORCE on CartPole

**Goal:** first neural network. A table is now impossible because the state space
is continuous.

**Equations on screen**

$$\nabla_\theta J = \mathbb{E}\Big[\sum_t \nabla_\theta \log \pi_\theta(a_t|s_t)\,\big(G_t - b(s_t)\big)\Big],
\qquad G_t = \sum_{k \ge t} \gamma^{k-t} r_k$$

**Environment** (~60 LOC). **Port the Gym source line for line; do not derive
it.** Semi-implicit Euler, four state variables, termination at `|x| > 2.4` or
`|θ| > 12°`.

$$\ddot\theta = \frac{g\sin\theta - \cos\theta\left[\frac{F + m_p\ell\dot\theta^2\sin\theta}{m_c+m_p}\right]}{\ell\left[\frac{4}{3} - \frac{m_p\cos^2\theta}{m_c+m_p}\right]},
\qquad \ddot x = \frac{F + m_p\ell(\dot\theta^2\sin\theta - \ddot\theta\cos\theta)}{m_c+m_p}$$

**Verification step (do this before writing any agent):** run a fixed policy in
both Python Gym and your JS env with the same seed and diff the trajectories. If
they diverge, your integrator is wrong. One afternoon; saves a week of blaming
the algorithm for a physics bug.

**Agent** (~100 LOC). 2-layer MLP (~50 parameters), softmax head. Episode buffer,
discounted returns, optional mean-return baseline, optional entropy bonus.

**Parameter schema.** Physics: pole length, mass, gravity, force magnitude.
Learning: hidden width, `lr`, `γ`, baseline on/off, entropy coefficient `β`.

**Visualizations**
- Cart + pole animation
- Live `π_θ(a|s)` probability bars
- **The payoff:** running gradient-variance estimate plotted with baseline ON vs.
  OFF, side by side. Everyone reads about variance reduction; almost nobody sees it.
- Episode return curve

**Milestones**
1. Env port + cross-verification against Python
2. `nn/` façade (mlp, categoricalHead, adam)
3. REINFORCE agent, headless convergence test
4. Live physics sliders — retrain under changed dynamics
5. Gradient-variance comparison panel

**Acceptance:** solves CartPole (mean return ≥ 195 over 100 episodes) in under
60 s of wall clock in-browser. Baseline-ON shows visibly lower gradient variance.

**Optional:** a DQN variant on the same env, to expose the replay buffer and
target-network lag visually. This also previews L5's machinery.

---

### Level 4 — PPO on Car Racing

**Goal:** actor-critic, GAE, trust region, parallel envs — and the first level
where reward hacking is something the user *causes* rather than reads about.

**Equations on screen**

$$L^{\text{CLIP}}(\theta) = \mathbb{E}\Big[\min\big(r_t(\theta)\hat{A}_t,\ \text{clip}(r_t(\theta), 1-\varepsilon, 1+\varepsilon)\hat{A}_t\big)\Big],
\qquad r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{\text{old}}}(a_t|s_t)}$$

$$\hat{A}_t = \sum_l (\gamma\lambda)^l \delta_{t+l}, \qquad \delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$$

**Environment** (~150 LOC). Bicycle model with slip. **Do not use Box2D or
Matter.js** — you'd inherit a physics engine you cannot expose in an equation
panel, and the contact solver breaks seeded replay.

- **State (~12 dims):** 8–9 raycast distances to track edges, speed, heading
  error vs. track tangent, lateral offset. Raycasts, not pixels.
- **Action:** continuous `[steer, throttle] ∈ [-1,1]²`
- **Reward:** centerline progress per step, minus wall-proximity and
  steering-jerk penalties

**Agent** (~200 LOC). Shared-trunk or separate actor/critic MLPs (2×64), Gaussian
policy head with state-independent `logStd`. Rollout → GAE → K epochs of
minibatch updates.

**Parameter schema.** `ε` (clip), `λ`, `γ`, value coefficient, entropy
coefficient, rollout length, update epochs, minibatch size, number of parallel
envs, learning rate + annealing.

**Visualizations**
- **Track editor** — the user draws the circuit. This is the single best
  manipulation affordance in the whole set.
- **Ratio histogram** with the clip band `[1-ε, 1+ε]` overlaid — literally watch
  what fraction of each batch gets clipped
- `approx_kl` per epoch (k3 estimator), `clipfrac`, explained variance
- Advantage distribution before / after normalization
- **Live reward-function editor** — a text box compiling to a JS closure
- **Generalization test:** train on track A, one button to evaluate on track B

**Milestones**
1. Bicycle-model env + raycast sensors + track representation
2. Track editor UI
3. GAE + clipped-surrogate helpers, unit-tested against known values
4. PPO agent, single env, converging on a simple oval
5. Vectorized envs in workers (8–16 parallel)
6. Diagnostics panel (ratio histogram, KL, clipfrac)
7. Reward editor + generalization test

**Acceptance:** completes a lap on a user-drawn moderate track within 5 minutes of
in-browser training. Reward hacking is reproducible on demand: rewarding raw
velocity produces tight circles; rewarding undirected checkpoint crossings
produces oscillation over one line. **Both emerge within a minute — that is the
lesson, and it should be a preset button.**

**Pitfalls.** Read *The 37 Implementation Details of PPO* before writing a line.
Most from-scratch PPO failures come from that list, not from the math. Observation
normalization, advantage normalization, orthogonal init with `sqrt(2)` scaling
and `0.01` on the policy head, and value-loss clipping all matter more than they
look.

**Alternative env:** pendulum swing-up, if you want something simpler to debug
first. It's a fine warm-up but a weaker demo — a gravity slider is far less
legible than a drawable track.

---

### Level 5 — Adaptive Opponent (Human-in-the-Loop)

**Goal:** a game that gets better *because you played it*. Self-play is one way to
generate experience, not the only one — and here it's the wrong one.

**The constraint that decides the design.** Count transitions per minute of human
attention:

| Setup | Transitions per 5 min of play |
|---|---|
| Turn-based (chess, Connect Four) | 50–200 |
| Real-time at 30 Hz | ~9,000 |
| Headless self-play | ~500,000 |

PPO needs 10⁵–10⁶ transitions. This is why learning-from-human-games fails for
chess and works for a real-time game: **the real-time framing closes the gap by
two orders of magnitude.** Pick a continuous-control game, and five minutes of
human play is a trainable dataset.

**The game.** Pursuit–evasion (you're the predator, it learns to escape — more
fun than the inverse), or air hockey if you want it to read as a real game.

**Equations on screen** — SAC critic target:

$$\mathcal{L}_Q = \mathbb{E}_{(s,a,r,s')\sim\mathcal{D}}\Big[\big(Q_\phi(s,a) - \big(r + \gamma\big[\min_i Q_{\bar\phi_i}(s',a') - \alpha\log\pi_\theta(a'|s')\big]\big)\big)^2\Big]$$

**Why off-policy is the core lesson.** PPO discards every transition after one
update — indefensible when each transition cost a fraction of a second of human
attention. SAC (continuous) or DQN (discrete) stores transitions and replays each
10–50 times. **Put the replay buffer on screen as a scrolling strip and highlight
which transitions were sampled this update.** The sample-efficiency argument then
needs no words.

**Four things that are new here, not scaled-up L4:**

1. **Off-policy replay** — as above.
2. **Non-stationarity.** You adapt while it adapts; the fixed-environment
   assumption every prior level relied on is now broken. Users feel it: an
   exploit works for 30 seconds, then stops. Visualize as a win-rate trace with
   both sides' adaptations marked.
3. **Opponent modeling.** A second head predicting the *human's* next action,
   `p̂(aʰ|s)`, trained by plain supervised learning on their actual inputs.
   Display its accuracy climbing and its predicted-move distribution as a ghost
   overlay. Watching a model call your dodge before you commit is the most
   memorable moment in the set.
4. **Difficulty targeting.** Pure reward maximization yields an unbeatable,
   boring opponent. Add a controller holding win-rate near a target `ρ*`, e.g.
   `τ ← τ + η(ρ̂ - ρ*)` on the policy temperature. This is a real design lesson:
   the objective you can write down is not the objective you want.

**Milestones**
1. Real-time pursuit env with mouse/touch input for the human agent
2. Replay buffer + SAC agent, validated against a scripted opponent first
3. Live training during human play, with the buffer visualization
4. Opponent-modeling head + ghost overlay
5. Difficulty controller
6. Warm-start: short headless self-play pretrain, then human fine-tuning

**Acceptance — and this is the level that fails for social rather than technical
reasons:** improvement must be *perceptible within 2–3 minutes of play*. If it
isn't, the premise collapses and users conclude it isn't learning at all. **Budget
your tuning effort on visible early improvement even at the cost of final
performance.** Warm-starting from self-play and then fine-tuning on the human is
the pragmatic fix — self-play as initialization rather than as the whole method.

**Alternative (turn-based).** If you want Connect Four instead, you can't rely on
data volume, so amplify it with **Dyna**: learn a model from the human's few
games, then train on thousands of imagined rollouts.

$$\text{Real: } (s,a,r,s') \to \text{update } Q,\ \hat{P},\ \hat{R}
\qquad \text{Imagined: } (s,a,\hat r,\hat s') \sim \hat{P} \to \text{update } Q$$

Two sliders (real steps vs. planning steps per real step) expose the tradeoff, and
model error becomes visible when planning-heavy settings learn confidently wrong
things. This is the on-ramp to MuZero.

**Alternative (preference-based).** Instead of playing against it, judge it: show
two short behavior clips, the user clicks the better one, fit a Bradley–Terry
reward model, then run PPO against it.

$$P(\tau_1 \succ \tau_2) = \frac{\exp\sum r_\psi(s_t,a_t)^{(1)}}{\exp\sum r_\psi(s_t,a_t)^{(1)} + \exp\sum r_\psi(s_t,a_t)^{(2)}}$$

This is RLHF on a pendulum. ~100 human clicks shapes recognizable behavior. It is
the canonical example of learning an objective you cannot specify analytically.

---

## 4. On Chess (and why it isn't Level 5)

Worth stating explicitly so the scope stays honest. Chess is not "Level 4 but
harder" — it's a different family:

1. **Reward is terminal and sparse.** One scalar at move ~80. `Â_t` is dominated
   by noise through the entire opening and middlegame. Structural, not a tuning
   issue.
2. **Action space is enormous and state-dependent.** AlphaZero uses a
   4,672-dimensional move encoding, most illegal at any position. Requires action
   masking, which changes the policy parameterization.
3. **Policy gradient alone doesn't get there.** AlphaZero works because MCTS is a
   *policy improvement operator* — search produces better distributions than the
   raw network, and the network is trained to imitate search. That makes chess a
   **model-based / planning** example, a different axis entirely.
4. **Compute.** AlphaZero used thousands of TPUs; Leela Chess Zero needed
   distributed volunteer GPUs over years. A browser tab yields a network that
   plays near-randomly forever — visually indistinguishable from a bug.

**If you want the self-play + search concepts anyway, use Connect Four.** ~10
minutes of browser training with a small net + MCTS reaches genuinely decent play,
and the user can test it honestly by playing it. The visualizations that make it
worth building: the MCTS tree expanding with visit counts `N(s,a)`, the raw prior
`P(s,a)` displayed *beside* the post-search distribution
`π(a) ∝ N(s,a)^{1/τ}` so the improvement operator is literally visible, and the
value head `v(s)` swinging as the human blunders.

Chess can be *demoed* with pretrained weights. It cannot be trained live.

---

## 5. Build Order

1. **`core/` + `runner/` + param schema** — the foundation
2. **Level 1 end-to-end**, including the worker and full telemetry path. L1 is
   trivial as an algorithm, which is exactly why it's the right vehicle for
   debugging the infrastructure. When the bandit runs in a worker with live
   sliders and a bound equation panel, the seams are proven.
3. **Level 2** — adds the grid renderer and step mode; no new infrastructure
4. **`nn/` façade + Level 3** — first gradients; cross-verify the env against
   Python before anything else
5. **Level 4** — vectorization, track editor, diagnostics. The largest single
   chunk.
6. **Level 5** — human input, replay buffer, opponent model

After step 2, each remaining level is mostly one env file plus one agent file.

**Environment discipline:** write all five envs first, in one pass, each as a pure
`{reset, step, params}` object with a seeded RNG. Test each with a random policy
and a hand-coded controller *before any learning code exists*. Environment bugs
masquerading as algorithm bugs is the biggest time sink in RL, and separating the
two up front is worth the discipline.

---

## 6. Why Build the Environments From Scratch

There is no maintained JS equivalent of Gymnasium. The candidates are abandoned:
[gym.js](https://github.com/ttumiel/gym.js) (stale since 2023, few envs),
[js-gym](https://github.com/bobiblazeski/js-gym) (Node-server-based, years old).
Adopting either means debugging dead code and writing the instrumentation anyway.

More importantly, a library env is a sealed `step()` — precisely the thing you
need to pry open. You require editable physics constants as live bindings,
seedable determinism, per-step introspection of `s, a, r, s', δ_t`, and headless
speed decoupled from rendering. Retrofitting those onto a wrapper costs more than
writing the env.

And they're small:

| Env | LOC |
|---|---|
| Bandit | ~30 |
| Gridworld | ~80 |
| CartPole | ~60 |
| Pendulum | ~40 |
| Car / bicycle model | ~150 |
| Pursuit | ~80 |

**Port, don't write.** Treat the Gym Python as a spec for CartPole and Pendulum.

**What you should NOT build yourself:** autodiff (use TF.js `tf.variableGrads`),
physics beyond ~2 links, plotting, KaTeX, worker plumbing.

**Escape hatch for a hypothetical Level 6:**
[mujoco_wasm](https://github.com/zalo/mujoco_wasm) runs MuJoCo 3.3.8 in the
browser with typed-array access to `qpos`/`qvel`/`ctrl` and Three.js rendering,
CPU-only. Wrong choice for L4 — multi-MB binary, and the dynamics are locked
inside compiled C so you can't expose the equations — but it's the right tool for
humanoid or dexterous manipulation later.

---

## 7. References

### Foundations
- Sutton & Barto, *Reinforcement Learning: An Introduction* (2nd ed.) — http://incompleteideas.net/book/RLbook2020.pdf
  (Ch. 2 → L1, Ch. 6 → L2, Ch. 8 → Dyna, Ch. 13 → L3)
- OpenAI Spinning Up — https://spinningup.openai.com/

### Level 3
- Williams (1992), *Simple Statistical Gradient-Following Algorithms* — https://link.springer.com/article/10.1007/BF00992696
- Karpathy, *Deep RL: Pong from Pixels* — https://karpathy.github.io/2016/05/31/rl/
- PyTorch REINFORCE example (~60 lines) — https://github.com/pytorch/examples/blob/main/reinforcement_learning/reinforce.py
- **TF.js cart-pole (browser reference implementation)** — https://github.com/tensorflow/tfjs-examples/tree/master/cart-pole
- CartPole env source — https://github.com/openai/gym/blob/master/gym/envs/classic_control/cartpole.py
- Pendulum env source — https://github.com/openai/gym/blob/master/gym/envs/classic_control/pendulum.py

### Level 4
- Schulman et al. (2017), *PPO* — https://arxiv.org/abs/1707.06347
- Schulman et al. (2015), *GAE* — https://arxiv.org/abs/1506.02438
- **The 37 Implementation Details of PPO (read first)** — https://iclr-blog-track.github.io/2022/03/25/ppo-implementation-details/
- CleanRL single-file implementations — https://github.com/vwxyzjn/cleanrl · docs https://docs.cleanrl.dev/rl-algorithms/ppo/
- Schulman, *Approximating KL Divergence* — http://joschu.net/blog/kl-approx.html
- Engstrom et al., *Implementation Matters in Deep Policy Gradients* — https://arxiv.org/abs/2005.12729
- Andrychowicz et al., *What Matters in On-Policy RL?* — https://arxiv.org/abs/2006.05990

### Level 5
- Haarnoja et al., *Soft Actor-Critic* — https://arxiv.org/abs/1801.01290
- Christiano et al., *Deep RL from Human Preferences* — https://arxiv.org/abs/1706.03741
- Schrittwieser et al., *MuZero* — https://arxiv.org/abs/1911.08265

### Self-play / search (optional Level 6)
- Silver et al., *AlphaZero* — https://arxiv.org/abs/1712.01815
- alpha-zero-general (Connect Four, Othello) — https://github.com/suragnair/alpha-zero-general

### Browser precedent
- Karpathy, REINFORCEjs — https://cs.stanford.edu/people/karpathy/reinforcejs/
  (good interaction-design reference for L2's gridworld; note its policy-gradient
  demos were omitted as unstable, so it offers nothing for L3–L5, and it predates
  WebGPU and JS autodiff — treat as UI reference, not a dependency)
- ConvNetJS Deep Q Learning demo — https://cs.stanford.edu/people/karpathy/convnetjs/demo/rldemo.html
