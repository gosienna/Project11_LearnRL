# TDD Implementation Plan — Interactive RL on the Web

Companion to `rl-web-framework.md` (§2.10 for the site, §5 for build order).
Every step below is **RED → GREEN → REFACTOR**: write the failing test with a
hand-computed expected value, then write the minimum code to pass it.

Stack: Vite + Vitest, ESM. One suite, two ways to run it.

- `npm test` (and `npm test -- --watch`) is the fast terminal loop.
- `npm run dev` serves the single site. `/` is the five-level ladder, `/l1`…
  `/l5` are the demos, `/tests` runs these same files in the browser.
- A level shows up on the ladder when its page exists. Its tests show up on
  `/tests` when `src/site/levels.js` lists those files. Do not keep a second
  copy of the expected values in the page.

Reading for each level lives under `reference/level-N/`, not in this file.

---

## 0. Why TDD Works Here (and the one trick that makes it possible)

Nearly every RL update rule is a closed-form arithmetic expression. `Q ← Q +
α(R − Q)`, `δ = r + γ max Q(s′) − Q(s,a)`, GAE, the PPO clip — all of them are
evaluable on paper in under a minute. That means the expected value in your test
is a **number you computed yourself**, not a number you recorded from a previous
run. This distinction is the whole discipline:

> **Never write an assertion by running the code and copying the output.**
> That tests that the code still does what it did, not that it does what it should.

### The enabling trick: inject the RNG

"Stochastic algorithm" is the usual excuse for not unit-testing RL. It dissolves
once every random draw goes through an injected interface. Write this file
first — before anything else in the project.

```js
// test/helpers/mockRng.js
export class MockRNG {
  constructor(seq) { this.seq = seq; this.i = 0; }
  uniform()  { return this.seq[this.i++]; }          // throws (undefined) if over-drawn — good
  int(n)     { return Math.floor(this.uniform() * n); }
  normal()   { return this.uniform(); }               // script z-scores directly
  categorical(p) {
    const u = this.uniform();
    let acc = 0;
    for (let i = 0; i < p.length; i++) { acc += p[i]; if (u < acc) return i; }
    return p.length - 1;
  }
}
```

Now an ε-greedy agent is a pure function of `(state, scripted draws)` and you can
assert exact action indices. Every `env`, `agent`, and `buffer` in the codebase
takes `rng` as a constructor argument. **`Math.random()` never appears in `src/`**
— add a lint rule for it on day one.

### Three tiers of test

| Tier | What | Speed | Determinism | When it runs |
|---|---|---|---|---|
| **0 — Golden fixture** | Hand-computed arithmetic on one update | <1 ms | Exact | Every save |
| **1 — Property / invariant** | Relationships that must hold for all inputs | <10 ms | Exact | Every save |
| **2 — Convergence** | "Does it actually learn" | 1–60 s | Seeded, still flaky | Pre-commit / CI only |

**Roughly 90% of your tests should be Tier 0 and 1.** Tier 2 tests tell you
*that* something is broken but never *where*. They belong in a separate file
(`*.slow.test.js`) excluded from the watch loop. A project where the only test is
"CartPole reaches 195" is a project where every bug costs a day to localize.

### Tier 1 properties worth knowing up front

These catch entire classes of bugs that golden fixtures miss:

- **Analytic limits.** GAE at `λ=1` must equal Monte-Carlo advantage; at `λ=0` it
  must equal the one-step TD error. Both are exact identities, testable to 1e-10.
- **Degenerate cases.** `α=0` → nothing changes. `γ=0` → myopic, ignores `s′`.
  `ε=0` → fully deterministic given the same state.
- **Conservation.** Softmax probabilities sum to 1. Replay buffer size never
  exceeds capacity.
- **Sign.** Approximate KL is always ≥ 0. Entropy is maximized at uniform.
- **Idempotence.** `load(save(agent))` produces byte-identical subsequent actions.

---

## 1. Level 0 — Core Infrastructure

Build this before any RL. Every level depends on it.

| # | RED (write this test) | Expected value | GREEN (implement) |
|---|---|---|---|
| 0.1 | Same seed → identical 1000-draw sequence; different seed → differs | exact equality / inequality | `core/rng.js` |
| 0.2 | `uniform()` over 10⁶ draws: mean ∈ [0.499, 0.501], all in [0,1) | statistical bound | — |
| 0.3 | `normal()` over 10⁶: mean ≈ 0 ± 0.01, std ≈ 1 ± 0.01 | statistical bound | Box–Muller |
| 0.4 | `categorical([0.2,0.3,0.5])` with scripted `u = 0.1, 0.4, 0.9` | `0, 1, 2` | — |
| 0.5 | `Discrete(4).contains(3)` true, `.contains(4)` false | bool | `core/spaces.js` |
| 0.6 | `Box([-1,-1],[1,1]).contains([0,2])` false | bool | — |
| 0.7 | Welford on `[2,4,4,4,5,5,7,9]` | mean `5`, popStd `2` | `core/stats.js` |
| 0.8 | Ring buffer cap 3, push 5 → holds last 3, `size === 3` | `[3,4,5]` | `core/buffer.js` |
| 0.9 | `sample(2, mockRng)` with scripted indices | exact items | — |
| 0.10 | Schema round-trip: `deserialize(serialize(s))` deep-equals `s` | deep equal | `core/schema.js` |

**Test 0.7 in full** — the classic dataset, hand-verifiable:

```js
test('welford matches known population stats', () => {
  const s = new RunningStats();
  [2,4,4,4,5,5,7,9].forEach(x => s.push(x));
  expect(s.mean).toBeCloseTo(5, 10);
  expect(s.std).toBeCloseTo(2, 10);   // population std, not sample
});
```

If you get `2.138` instead of `2`, you implemented sample variance (`n−1`). Decide
which you want and encode it in the test name.

---

## 2. Level 1 — k-armed Bandit

Reading: `reference/level-1/README.md` (Sutton & Barto ch. 2 extract, Weng,
Silver lecture 9). Thompson sampling and gradient bandits are out of scope;
the tests below are ε-greedy, UCB, constant α, sample average, and
non-stationary drift.

Headless tests 1.1–1.13 come before the page. When they are green, the same
files are what `/tests` runs for L1, and `/l1` is the bandit demo on the
ladder (worker, sliders, charts). Slots L2–L5 stay placeholders. The slow
check (1.13) is opt-in on both `npm run test:slow` and the bench's **Run slow**
button.

### RED sequence

| # | Test | Hand-computed expected |
|---|---|---|
| 1.1 | Constant-α update, twice | see below |
| 1.2 | Sample-average update equals running mean | see below |
| 1.3 | `α = 0` → Q unchanged | identity |
| 1.4 | Greedy selection with tied Q | lowest index (document the tiebreak!) |
| 1.5 | ε-greedy with scripted RNG | exact arm index |
| 1.6 | `ε = 0` → always argmax | exact |
| 1.7 | `ε = 1` → always the scripted random arm | exact |
| 1.8 | UCB selection | see below |
| 1.9 | UCB picks any unvisited arm first | `N(a)=0` → +∞ |
| 1.10 | Env reward distribution | mean/std bound |
| 1.11 | Cumulative regret | see below |
| 1.12 | Non-stationary drift changes μ | inequality |
| 1.13 | **Tier 2:** ≥80% optimal-arm rate by 1000 pulls | statistical |

### The three fixtures worth writing out

**1.1 — constant step size.** `Q₀ = 0`, `α = 0.1`.

```
R = 1 :  Q = 0   + 0.1(1 − 0)   = 0.1
R = 0 :  Q = 0.1 + 0.1(0 − 0.1) = 0.09
```

```js
test('constant-alpha incremental update', () => {
  const a = new BanditAgent({ k: 1, alpha: 0.1, rng: new MockRNG([]) });
  a.update(0, 1); expect(a.Q[0]).toBeCloseTo(0.1,  10);
  a.update(0, 0); expect(a.Q[0]).toBeCloseTo(0.09, 10);
});
```

**1.2 — sample average must equal the arithmetic mean.** Rewards `[1, 0, 2]`:

```
n=1: Q = 0   + (1/1)(1 − 0)   = 1
n=2: Q = 1   + (1/2)(0 − 1)   = 0.5
n=3: Q = 0.5 + (1/3)(2 − 0.5) = 1.0     ← mean([1,0,2]) = 1 ✓
```

This is a Tier-1 property in disguise: assert `Q === mean(rewards)` for a random
reward list, and you've tested the incremental form against its closed form.

**1.8 — UCB.** `Q = [0.5, 0.3]`, `N = [1, 3]`, `t = 4`, `c = 2`:

```
UCB(0) = 0.5 + 2·√(ln4 / 1) = 0.5 + 2(1.17741002) = 2.85482005
UCB(1) = 0.3 + 2·√(ln4 / 3) = 0.3 + 2(0.67977800) = 1.65955600
argmax → 0
```

**1.11 — regret.** True `μ = [1.0, 0.5, 0.2]`, `μ* = 1.0`. Pull sequence
`[1, 2, 0, 0]`:

```
regret = (1−0.5) + (1−0.2) + 0 + 0 = 1.3
```

Note this uses *true* means, not sampled rewards — a common bug is computing
regret from observed noise.

### Tiebreak warning

Test 1.4 exists because `argmax` over an all-zeros `Q` is where ε-greedy secretly
becomes "always arm 0." Pick a rule — lowest index, or random among ties — write
it in the test name, and be consistent across all five levels.

---

## 3. Level 2 — Gridworld Q-learning

### RED sequence

| # | Test | Hand-computed expected |
|---|---|---|
| 2.1 | Q-learning update | `0.4` (below) |
| 2.2 | SARSA update, same inputs | `−0.05` (below) |
| 2.3 | Expected SARSA under ε-greedy | weighted average |
| 2.4 | **Terminal → no bootstrap** | `−50` (below) |
| 2.5 | **Truncated → DOES bootstrap** | differs from 2.4 |
| 2.6 | `γ = 0` → `Q = αr` | myopic |
| 2.7 | Wall blocks movement | `s′ === s` |
| 2.8 | Out-of-bounds blocked | `s′ === s` |
| 2.9 | Slip probability with scripted RNG | exact `s′` |
| 2.10 | `slip = 0` → deterministic | exact |
| 2.11 | 1×3 corridor converges exactly | `[−2, −1]` (below) |
| 2.12 | `V(s) = max_a Q(s,a)` | exact |
| 2.13 | **Tier 2:** Cliff Walking — Q-learning takes the edge, SARSA the detour | path comparison |

### Fixtures

**2.1 / 2.2 — the on-policy/off-policy pair.** `Q(s,a) = 0`, `r = −1`, `γ = 0.9`,
`α = 0.5`, `Q(s′,·) = [2, 1]`, and the ε-greedy draw selected `a′ = 1`:

```
Q-learning: δ = −1 + 0.9·max(2,1) − 0 = −1 + 1.8 = 0.8   → Q = 0.5(0.8)  =  0.4
SARSA:      δ = −1 + 0.9·Q(s′,a′=1) − 0 = −1 + 0.9 = −0.1 → Q = 0.5(−0.1) = −0.05
```

Same inputs, opposite-signed outputs. This single pair of tests is the heart of
Level 2 — write it before either implementation exists.

**2.4 / 2.5 — the distinction Gym got wrong.** `Q(s,a) = 0`, `r = −100`,
`γ = 0.9`, `α = 0.5`, `Q(s′,·) = [10, 10]`:

```
terminated = true : δ = −100 − 0                  = −100 → Q = −50
truncated  = true : δ = −100 + 0.9(10) − 0        = −91  → Q = −45.5
```

If both give `−50`, you're treating a time limit as an absorbing state and your
value function will be biased low for every long episode.

**2.11 — exact convergence on a corridor.** States `0 → 1 → 2(goal)`, `r = −1` per
step, `γ = 1`, `α = 1`, deterministic. With `α = 1` the update is exact, so after
enough sweeps:

```
Q(1, right) = −1 + 0  = −1      (2 is terminal)
Q(0, right) = −1 + (−1) = −2
```

Assert to 1e-10. This is the only "does it learn" test that is fully
deterministic — treasure it, because it catches most integration bugs before you
ever need a Tier 2 run.

---

## 4. Level 3 — REINFORCE on CartPole

### Phase A — environment (before any learning code)

| # | Test | Expected |
|---|---|---|
| 3.1 | **Golden physics step** | see below |
| 3.2 | Second step from state 3.1 | hand-compute again |
| 3.3 | Action 0 mirrors action 1 from symmetric state | exact negation |
| 3.4 | Terminates at `\|x\| > 2.4` | `terminated === true` |
| 3.5 | Terminates at `\|θ\| > 0.2094395102` rad (12°) | `terminated === true` |
| 3.6 | Reward is `+1` on every non-terminal step | `1` |
| 3.7 | `reset(rng)` draws 4 values in `[−0.05, 0.05]` | bound |
| 3.8 | Doubling gravity roughly doubles initial `θ̈` | ratio |
| 3.9 | **Cross-verification vs. Python Gym** | trajectory diff |

**3.1 — the golden fixture.** Gym defaults: `g=9.8`, `m_c=1.0`, `m_p=0.1`,
`ℓ=0.5`, `F=10.0`, `τ=0.02`. From `s = [0,0,0,0]` with `action = 1` (`F = +10`):

```
temp = (10 + 0)/1.1                             = 9.09090909091
θ̈    = (0 − 1·9.09090909091) / (0.5(4/3 − 0.1/1.1))
     = −9.09090909091 / 0.62121212121          = −14.6341463415
ẍ    = 9.09090909091 − (0.05)(−14.6341463415)/1.1
     = 9.09090909091 + 0.66518847007           =   9.75609756098

Euler:  x′ = 0
        ẋ′ = 0.02(9.75609756098)   =  0.19512195122
        θ′ = 0
        θ̇′ = 0.02(−14.6341463415) = −0.29268292683
```

```js
test('golden physics step from origin, action=1', () => {
  const env = new CartPole();
  env.state = [0, 0, 0, 0];
  const { obs } = env.step(1);
  expect(obs[0]).toBeCloseTo( 0,             12);
  expect(obs[1]).toBeCloseTo( 0.19512195122, 10);
  expect(obs[2]).toBeCloseTo( 0,             12);
  expect(obs[3]).toBeCloseTo(-0.29268292683, 10);
});
```

**3.9 — the test that saves a week.** Dump 200 steps from Python Gym under a fixed
action sequence to `test/fixtures/cartpole_trajectory.json`, then:

```js
test('matches Python Gym over 200 steps', () => {
  const ref = JSON.parse(readFileSync('test/fixtures/cartpole_trajectory.json'));
  const env = new CartPole();
  env.state = [...ref.initialState];
  ref.actions.forEach((a, t) => {
    const { obs } = env.step(a);
    obs.forEach((v, i) => expect(v).toBeCloseTo(ref.states[t][i], 9));
  });
});
```

This is the single highest-value test in the project. Without it, an integrator
sign error surfaces three weeks later as "PPO won't converge."

### Phase B — network and agent

| # | Test | Expected |
|---|---|---|
| 3.10 | `discountedReturns([1,1,1], γ=0.9)` | `[2.71, 1.9, 1]` |
| 3.11 | `γ=0` → returns equal rewards | identity |
| 3.12 | `γ=1` → returns are suffix sums | `[3,2,1]` |
| 3.13 | Returns reset across episode boundary (`dones`) | no leakage |
| 3.14 | Softmax head: probs sum to 1, all > 0 | `1.0` |
| 3.15 | `logProb` of sampled action matches `log(probs[a])` | exact |
| 3.16 | Entropy maximal at uniform: `log(n)` | `log(2) = 0.693147` |
| 3.17 | Entropy → 0 as logits diverge | `< 1e-6` |
| 3.18 | Gaussian `logProb(0 \| μ=0, σ=1)` | `−0.91893853320` |
| 3.19 | Deterministic mode ignores RNG | exact |
| 3.20 | Baseline reduces gradient variance | inequality |
| 3.21 | `save()/load()` → identical next action | exact |
| 3.22 | **Tier 2:** mean return ≥ 195 over 100 episodes | statistical |

**3.10:** `G₂ = 1`, `G₁ = 1 + 0.9(1) = 1.9`, `G₀ = 1 + 0.9(1.9) = 2.71`.

**3.18:** `−½log(2π) = −0.9189385332046727`.

**3.20 — the variance claim, as a test.** Run N=200 episodes with a frozen policy,
compute the gradient estimate with and without the mean-return baseline, assert
`var(withBaseline) < var(without)`. This is Tier 1½: statistical but robust, and
it's the claim your UI makes to the user, so it should be enforced by CI rather
than assumed.

---

## 5. Level 4 — PPO on Car Racing

### Phase A — GAE and losses (pure functions, test before the agent exists)

| # | Test | Expected |
|---|---|---|
| 4.1 | GAE, 3 steps | see below |
| 4.2 | **`λ=1` ≡ Monte-Carlo advantage** | `3.2463392` |
| 4.3 | **`λ=0` ≡ one-step TD error** | `1.094` |
| 4.4 | GAE respects `dones` | no bootstrap across boundary |
| 4.5 | `clipLoss` positive advantage, ratio above band | `−2.4` |
| 4.6 | `clipLoss` negative advantage, ratio above band | `+2.6` |
| 4.7 | `clipLoss` at `ratio = 1` | `−adv` exactly |
| 4.8 | `clipfrac` | `0.5` |
| 4.9 | `approxKL` k3 at `logratio = 0` | `0` |
| 4.10 | `approxKL` k3 ≥ 0 for 1000 random logratios | non-negative |
| 4.11 | Advantage normalization → mean 0, std 1 | exact |
| 4.12 | Explained variance of perfect predictor | `1.0` |

**4.1 — the GAE fixture.** `rewards = [1,1,1]`, `V = [0.5, 0.6, 0.7]`,
`V(s₃) = 0.8`, `γ = 0.99`, `λ = 0.95`, no terminations. `γλ = 0.9405`.

```
δ₀ = 1 + 0.99(0.6) − 0.5 = 1.094
δ₁ = 1 + 0.99(0.7) − 0.6 = 1.093
δ₂ = 1 + 0.99(0.8) − 0.7 = 1.092

Â₂ = 1.092
Â₁ = 1.093 + 0.9405(1.092)   = 2.12002600
Â₀ = 1.094 + 0.9405(2.120026) = 3.08788445
```

**4.2 — the identity that proves the recursion.** Same inputs, `λ = 1`:

```
Â₀ = δ₀ + γδ₁ + γ²δ₂ = 1.094 + 1.08207 + 1.0702692 = 3.2463392
Monte-Carlo check:
G₀ = 1 + 0.99 + 0.9801 + 0.99³(0.8) = 2.9701 + 0.7762392 = 3.7463392
G₀ − V(s₀) = 3.7463392 − 0.5 = 3.2463392   ✓
```

Assert both paths agree to 1e-10. If your GAE has an off-by-one in the value
offset, this catches it instantly — which is worth a great deal, because an
off-by-one in GAE produces an agent that learns *slowly* rather than *not at
all*, and is therefore nearly invisible without the test.

**4.5 / 4.6 — the asymmetry everyone gets wrong.** `ε = 0.2`:

```
ratio = 1.3, Â = +2:  unclipped = 2.6,  clipped = 1.2(2)  = 2.4   min → 2.4   loss = −2.4
ratio = 1.3, Â = −2:  unclipped = −2.6, clipped = 1.2(−2) = −2.4  min → −2.6  loss = +2.6
```

With negative advantage the *upper* clip does not protect you — the unclipped term
wins the `min`. Implementations that clip the ratio before multiplying instead of
taking the `min` of two products fail 4.6 and pass 4.5, which is exactly the bug
that survives casual testing.

**4.8:** ratios `[0.9, 1.0, 1.25, 0.75]`, `ε = 0.2`, band `[0.8, 1.2]` → `1.25`
and `0.75` are outside → `2/4 = 0.5`.

### Phase B — environment

| # | Test | Expected |
|---|---|---|
| 4.13 | Raycast, straight wall at distance 1 | `1.0` |
| 4.14 | Raycast, no hit within range | `maxRange` |
| 4.15 | Raycast at 45° to a wall at distance 1 | `√2 = 1.41421356` |
| 4.16 | Zero throttle, zero steer → no position change | exact |
| 4.17 | Full left vs. full right steer → mirrored heading | exact negation |
| 4.18 | Straight-line progress reward | `Δs` along centerline |
| 4.19 | **Backwards motion gives negative progress** | `< 0` |
| 4.20 | Off-track → terminates | `terminated` |
| 4.21 | Action clamped to `[−1, 1]` | bound |

Test 4.19 is a reward-hacking guard: it's the test that fails if progress is
computed as unsigned distance, which is the bug that produces the oscillating car.

### Phase C — vectorization and integration

| # | Test | Expected |
|---|---|---|
| 4.22 | `VecEnv(8)` steps all 8 | shape `[8, obsDim]` |
| 4.23 | Auto-reset on termination | fresh obs, flag set |
| 4.24 | Vectorized results ≡ 8 sequential single envs, same seeds | exact |
| 4.25 | Rollout buffer shape after `T` steps × `N` envs | `[T*N, ...]` |
| 4.26 | `setParam` mid-run changes behavior | inequality |
| 4.27 | `save()/load()` round-trip | identical action |
| 4.28 | **Tier 2:** completes a lap on the oval in < 5 min | statistical |

Test 4.24 is the one that matters. Vectorization bugs — a stale observation, a
missed auto-reset, an env stepped twice — are nearly undetectable in aggregate
reward curves but obvious against a sequential reference.

---

## 6. Level 5 — Adaptive Opponent

### Phase A — replay and targets

| # | Test | Expected |
|---|---|---|
| 5.1 | Capacity enforced: push 5 into cap 3 | `size === 3`, holds last 3 |
| 5.2 | Overwrite is FIFO, not random | exact contents |
| 5.3 | `sample(n, mockRng)` | exact indices |
| 5.4 | Sampling from an under-full buffer | no `undefined` |
| 5.5 | `(s,a,r,s′,done)` alignment survives wraparound | exact tuple |
| 5.6 | SAC target | `2.584` (below) |
| 5.7 | Terminal → no bootstrap in SAC target | `r` only |
| 5.8 | Twin critic takes the **min** | `min`, not mean |
| 5.9 | `α = 0` → target reduces to TD3 form | identity |
| 5.10 | Polyak update | `0.9` (below) |
| 5.11 | `τ = 1` → target copies online exactly | identity |
| 5.12 | `τ = 0` → target frozen | identity |
| 5.13 | tanh-squash log-prob correction | `−0.86756` (below) |
| 5.14 | Squashed actions strictly within `(−1, 1)` | bound |

**5.6 — SAC target.** `r = 1`, `γ = 0.99`, `Q̄₁ = 2.0`, `Q̄₂ = 1.5`, `α = 0.2`,
`log π(a′|s′) = −0.5`:

```
min(Q̄) = 1.5
entropy term = −α log π = −0.2(−0.5) = +0.1
y = 1 + 0.99(1.5 + 0.1) = 1 + 1.584 = 2.584
```

**5.10 — Polyak.** `θ̄ ← τθ + (1−τ)θ̄` with `θ̄ = 1`, `θ = 0`, `τ = 0.1` → `0.9`.
Test 5.11/5.12 pin the convention, because half the literature writes it the other
way round and a flipped `τ` gives you a target network that tracks *instantly* —
which silently removes the stabilization the target network exists to provide.

**5.13 — the Jacobian correction.** `log π(a) = log π(u) − Σ log(1 − tanh²u)`.
At `u = 1`: `tanh(1) = 0.76159416`, `tanh² = 0.58002566`, `1 − tanh² = 0.41997434`,
`log(0.41997434) = −0.86756170`. So the squashed log-prob is *larger* than the
Gaussian one by `0.86756170` — squashing concentrates density. If your test
expects a decrease, you've got the sign backwards.

### Phase B — human-in-the-loop

| # | Test | Expected |
|---|---|---|
| 5.15 | Scripted human input → deterministic trajectory | exact |
| 5.16 | Opponent model: constant human action → accuracy → 1.0 | `> 0.95` after N |
| 5.17 | Opponent model: uniform random human → accuracy ≈ chance | `≈ 1/nActions` |
| 5.18 | Difficulty controller raises `τ` when win-rate below target | `Δτ > 0` |
| 5.19 | Difficulty controller is stable (no oscillation) | bounded |
| 5.20 | Learning continues while paused-for-render | step count advances |
| 5.21 | **Tier 2:** measurable improvement vs. a scripted opponent in 3 min | statistical |

Tests 5.16 and 5.17 are a matched pair: a model that hits high accuracy on
*both* is not learning, it's leaking. And 5.21 is the acceptance criterion from
the framework doc promoted to an automated check — since "perceptible improvement
within 2–3 minutes" is a product requirement, script a fixed synthetic opponent
and assert it.

---

## 7. Running the Suite

The site and the terminal execute one Vitest suite. CI uses the terminal.
While you build, `npm run dev` is how you see the ladder fill in and how you
re-run a level without leaving the page.

```
package.json
  "dev":        "vite"
  "test":       "vitest --exclude '**/*.slow.test.js'"
  "test:slow":  "vitest --include '**/*.slow.test.js' --testTimeout=120000"
  "test:all":   "npm run test && npm run test:slow"
```

Keep `npm test` under **2 seconds**. That's the budget that keeps the red-green
loop tight enough to actually practice TDD rather than merely intend to. Tier 2
runs pre-commit, in CI, and only when you press **Run slow** on `/tests`.

### On the site (`npm run dev`)

| Path | Role |
|------|------|
| `/` | Five slots. A finished level links to its demo and shows the last fast-suite result for its files. An unfinished level stays "not built yet". |
| `/l1` … `/l5` | That level's page, mounted from `src/site/levels.js`. |
| `/tests` | **Run fast** (same as `npm test`), **Run this level** (files registered for that level), **Run slow** (that level's `test/slow/` file). |

Results on `/tests` are file, test name, pass or fail, and the assertion
message. `levels.js` is the only list of which test files belong to which
level; the bench does not hard-code a second list.

### File layout

Same tree as `rl-web-framework.md` §2.8: `test/` mirrors `src/` (`core/`,
`env/`, `agent/`, `agent/lib/`), plus `test/helpers/mockRng.js`,
`test/fixtures/`, and `test/slow/l1.slow.test.js` … `l5.slow.test.js`.
The shell is `index.html` and `src/site/` (`App.jsx`, `levels.js`,
`TestBench.jsx`). Pages are `src/pages/L1.jsx` … `L5.jsx`.

---

## 8. Two Rules Worth Repeating

**Never record an expected value from a run.** If you can't compute it by hand,
you don't understand the update well enough to implement it — and the test you'd
write instead only pins current behavior, bugs included. The two exceptions are
the Python cross-verification fixture (3.9, where the reference is an independent
trusted implementation) and Tier 2 thresholds (which are bounds, not equalities).

**When a Tier 2 test fails, do not debug it.** Go find the Tier 0 or Tier 1 test
that *should* have caught it, write that test, watch it go red, and fix there.
Every Tier 2 failure is a gap in the fast suite. Treating it that way is what
keeps the fast suite from rotting into decoration over the course of five levels.
