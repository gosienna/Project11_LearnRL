# Level 1 — k-armed bandit

Exploration versus exploitation. No state, no bootstrapping. The update on screen
is the constant-step-size action value, with ε-greedy and UCB as the two policies,
plus a non-stationary arm-mean mode.

## 0. Tooling, then seeded draws

[tooling.md](tooling.md) — root `package.json`, the four npm scripts, and why
Vitest points at `student/`. Read this for L1.0a.

[xorshift32.md](xorshift32.md) — how `RNG.uniform` turns one integer seed into
a repeatable fraction in `[0, 1)`. Read this while implementing `student/core/rng.js`.

## 1. Sutton & Barto, Chapter 2

Local extract: [sutton-barto-chapter-2.pdf](sutton-barto-chapter-2.pdf)
(same text as pp. 25–44 of the full book in `reference/`).

Read §§2.1–2.7 and §2.5. That is the 10-armed testbed, the incremental update
(sample average `1/N` versus constant `α`), non-stationary tracking, and UCB.
Skip gradient bandits (§2.8) and contextual bandits (§2.9); this level does not
use them.

## 2. Lilian Weng, *The Multi-Armed Bandit Problem and Its Solutions*

https://lilianweng.github.io/posts/2018-01-23-multi-armed-bandit/

About 10 minutes. Same dilemma as the chapter, with ε-greedy, UCB, and Thompson
sampling side by side, plus regret curves. Use it to see why UCB pulls uncertain
arms instead of flipping a coin. Thompson sampling is extra; the demo only
implements ε-greedy and UCB.

## 3. David Silver, Lecture 9: Exploration and Exploitation

https://www.youtube.com/watch?v=sGuiWX07sKw

Course index: http://www.davidsilver.uk/teaching/

The first half is the bandit problem this level is built on. Watch through
ε-greedy and upper confidence bounds. The later Gittins and Bayesian material
is beyond the demo.

## 4. Optional: Zai & Brown, *Deep Reinforcement Learning in Action*, §2.2

Local full book in `reference/` (gitignored; PDF page = printed page + 22):
§2.2 Solving the multi-arm bandit [p. 50](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=50).

The same 10-armed problem in Python, with ε-greedy and softmax selection. It has
no UCB; the demo's UCB comes from Sutton & Barto §2.7. Skip §§2.3–2.5 (ad
placement, PyTorch, contextual bandits).
