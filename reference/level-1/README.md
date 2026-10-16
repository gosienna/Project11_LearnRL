# Level 1 — k-armed bandit

Exploration versus exploitation. No state, no bootstrapping. The update on screen
is the constant-step-size action value, with ε-greedy and UCB as the two policies,
plus a non-stationary arm-mean mode.

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
