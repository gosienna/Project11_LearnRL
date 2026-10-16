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
