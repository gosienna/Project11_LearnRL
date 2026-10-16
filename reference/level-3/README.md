# Level 3 — REINFORCE on CartPole

A table no longer fits: the state is continuous, so a small network represents
the policy. The update is the policy gradient with a reward-to-go and an
optional baseline. Stop before actor-critic; that is level 4.

The pole to port is Gymnasium CartPole-v1 (semi-implicit Euler, `|x| > 2.4` or
`|θ| > 12°`):
https://gymnasium.farama.org/environments/classic_control/cart_pole/

## 1. Sutton & Barto, Chapter 13, §§13.1–13.4

Full book in `reference/`, pp. 321–330.

Policy approximation, the policy gradient theorem, REINFORCE, and REINFORCE
with a state-dependent baseline. The baseline is what the variance panel is
showing. Leave §13.5 (actor-critic) and §13.7 (continuous actions) for level 4.

## 2. OpenAI Spinning Up, Part 3: Intro to Policy Optimization

https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html

The derivation that matches the equation on screen: simplest policy gradient,
reward-to-go, “don’t let the past distract you,” and baselines. Read through
the baseline section. The later “other forms” that introduce a learned value
function are the bridge into level 4, not this agent.

## 3. Andrej Karpathy, *Deep Reinforcement Learning: Pong from Pixels*

https://karpathy.github.io/2016/05/31/rl/

The short intuition for the same estimator: sample an episode, treat
`∇ log π(a|s)` as the direction that makes the taken action more likely, and
scale it by the return. The game is Pong rather than CartPole; the update is
the one this level implements. Ignore the pixel-preprocessing; CartPole’s
observation is already four numbers.
