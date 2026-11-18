# Level 4 — PPO on car racing

Actor-critic, generalized advantage estimation, a clipped trust region, and a
continuous `[steer, throttle]` action. Read the implementation note before
writing the agent: most from-scratch PPO failures are the details, not the
clip formula.

## 1. Schulman et al., *Proximal Policy Optimization Algorithms* (2017)

https://arxiv.org/abs/1707.06347

The clipped surrogate `L^CLIP` and the probability ratio on screen. Read the
clip objective and the algorithm box. The TRPO preamble is background for why
the ratio is clipped; you do not need to implement the KL constraint.

## 2. Huang et al., *The 37 Implementation Details of Proximal Policy Optimization*

https://iclr-blog-track.github.io/2022/03/25/ppo-implementation-details/

The checklist the framework points at. Read the 13 core details and the
continuous-action section (advantage normalization, observation normalization,
value-loss clipping, orthogonal initialization, separate log-std). The Atari
and LSTM sections are out of scope for a raycast racer.

## 3. OpenAI Spinning Up, Proximal Policy Optimization

https://spinningup.openai.com/en/latest/algorithms/ppo.html

Pseudocode that puts the clip loss next to a learned value function and GAE

`A_t = Σ_l (γλ)^l δ_{t+l}`.

The GAE derivation itself is Schulman et al. 2015,
https://arxiv.org/abs/1506.02438
— read Spinning Up’s advantage section first, and open that paper if the `λ`
trace is still unclear. The Gaussian policy head here is also the one level 4
uses for steer and throttle.

## Book bridge (from the Level 3 extract)

Sutton & Barto §13.5 Actor–Critic Methods
([p. 11](../level-3/sutton-barto-chapter-13.pdf#page=11)) and §13.7 Policy
Parameterization for Continuous Actions
([p. 15](../level-3/sutton-barto-chapter-13.pdf#page=15)). Read these before
the papers if the critic or the Gaussian head is new.

## 4. Zai & Brown, *Deep Reinforcement Learning in Action*, Chapter 5

Local full book in `reference/` (gitignored; PDF page = printed page + 22):
§5.1 [p. 135](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=135) · §5.2 Distributed training [p. 140](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=140) ·
§5.3 Advantage actor-critic [p. 145](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=145) · §5.4 N-step actor-critic
[p. 154](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=154).

The step from level 3's REINFORCE to an actor-critic, still on CartPole. Its
network shares a body between two heads (Figure 5.11); the framework keeps actor
and critic separate, per *37 details*. N-step returns are the fixed-horizon
version of GAE's `λ`. The book does not cover PPO (§11.2.2) or GAE.

## 5. Sutton & Barto, §12.1 The λ-return

Local extract: [sutton-barto-chapter-12.pdf](sutton-barto-chapter-12.pdf#page=2),
book PDF pages 309–342. Extract page = book PDF page − 308.

The `λ`-weighted average of n-step returns, with `λ = 0` giving one-step TD
and `λ = 1` giving Monte Carlo. GAE applies the same weighting to TD errors.
