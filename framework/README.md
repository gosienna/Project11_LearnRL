# Framework

The plan for the five-level RL site and the bite checklists that track progress.

| File | Role |
|------|------|
| [rl-web-framework.md](rl-web-framework.md) | What gets built: the ladder, shared architecture, per-level plans, build order |
| [rl-web-tdd-plan.md](rl-web-tdd-plan.md) | How it gets built: the RED sequence and hand-computed fixtures per level |
| [level-1-bites.md](level-1-bites.md) | k-armed bandit, plus the core and site shell every later level reuses |
| [level-2-bites.md](level-2-bites.md) | Cliff Walking, tabular Q-learning / SARSA / Expected SARSA |
| [level-3-bites.md](level-3-bites.md) | CartPole, the `nn/` façade, REINFORCE with baseline |
| [level-4-bites.md](level-4-bites.md) | Car racing, GAE, PPO clip, vectorized envs |
| [level-5-bites.md](level-5-bites.md) | Pursuit game, replay buffer, SAC, opponent model, difficulty control |

The framework docs are the source of truth for *what* the learner implements.
The reading for each level is in `reference/level-N/README.md`.

## Bite rules (all levels)

Every checklist line is one bite.

- **One file per bite.** The `File:` named on the line is the only file the
  learner edits in that bite.
- **10 lines or fewer.** If a bite grows past that, split it in the checklist
  (for example `L3.14Ga`, `L3.14Gb`) before teaching it.
- **Observable.** Every bite names what the learner sees change: a red test, a
  green test, a number in the console, a shape on the canvas, a slider that
  moves something.
- **RED then GREEN.** A row from the TDD plan becomes two bites:
  - `…R`: write the test in `student/test/…`. Observe: `npm test` fails *for
    the expected reason* (the module or function is missing, or the value is
    wrong). It must not fail because of a typo in the test.
  - `…G`: write the code in `student/…`. Observe: that test turns green and
    nothing else turns red.
  - A Tier 1 property (for example `α = 0` gives no change) usually needs no
    new code. Its G bite is "observe it pass". If it fails, fix the earlier
    GREEN code inside that bite.
- **Site bites** (pages, widgets, worker) have no test file. Their Observe line
  is the browser at `npm run dev`.
- **Paths** are relative to `student/` unless they start with `framework/`,
  `reference/`, or the repo root (`package.json`, `vite.config.js`).
- **Expected values are hand-computed.** They come from the TDD plan or from
  arithmetic on paper. Never from running the code.

## Progress

Checkboxes are the record (`[x]` means the learner implemented the bite and
observed the effect). Each level file ends with a **Current bite** note. One
level is active at a time. When its last box is ticked, set its note to
"complete" and make the next level's first bite active.

Progress lives on the learner's `learn/<slug>` branch, one commit per finished
bite (see `.cursor/skills/instructor/SKILL.md` → **How to track learning**).

## Shared code: where each piece first appears

Core pieces are built in the level that first needs them, not up front, so
every bite has something to observe.

| Piece | File | First built in |
|-------|------|----------------|
| Vitest + Vite setup | `package.json`, `vite.config.js` (repo root) | L1.0a, L1.14a |
| MockRNG | `test/helpers/mockRng.js` | L1.0b |
| Seeded RNG `uniform`, `int`, `normal` | `core/rng.js` | L1.0c–L1.0f |
| Site shell, `levels.js`, test bench | `site/` | L1.14–L1.15 |
| Worker + telemetry | `runner/` | L1.16 |
| Param schema | `core/schema.js` | L1.17a |
| Widgets | `ui/` | L1.17–L1.18 |
| `Discrete` space | `core/spaces.js` | L2.0 |
| Welford stats | `core/stats.js` | L3.0a |
| `categorical` | `core/rng.js`, MockRNG | L3.0b (softmax sampling) |
| `discountedReturns` | `agent/lib/returns.js` | L3.11 |
| `nn/` façade (TF.js): `mlp`, `categoricalHead`, `adam` | `nn/` | L3.14–L3.19 |
| `Box` space | `core/spaces.js` | L4.0a |
| `gaussianHead` | `nn/heads.js` | L4.0b |
| Ring buffer `push` / `drain` | `core/buffer.js` | L4.0c |
| `gae`, `clipLoss`, `approxKL`, `normalize` | `agent/lib/` | L4.1–L4.11 |
| `VecEnv` | `env/vec.js` | L4.25 |
| Ring buffer `sample` | `core/buffer.js` | L5.3 |
| `sacTarget`, `polyakUpdate` | `agent/lib/targets.js` | L5.6–L5.11 |
| tanh-squash correction | `nn/heads.js` | L5.12 |

The TDD plan lists core tests 0.1–0.10 together. The bite files spread them
across levels using the table above. The test IDs are kept, so
`[TDD 0.7]` in `level-3-bites.md` is Welford.
