# Level 3 — REINFORCE on CartPole

A table no longer fits: the state is continuous, so a small network represents
the policy. The update is the policy gradient with a reward-to-go and an
optional baseline. Stop before actor-critic; that is level 4.

The pole to port is Gymnasium CartPole-v1 (explicit Euler, Gym's default integrator, `|x| > 2.4` or
`|θ| > 12°`):
https://gymnasium.farama.org/environments/classic_control/cart_pole/

## 1. Sutton & Barto, Chapter 13, §§13.1–13.4

Local extract: [sutton-barto-chapter-13.pdf](sutton-barto-chapter-13.pdf),
book PDF pages 343–362 (printed pp. 321–340). Extract page = book PDF page − 342.

§13.1 [p. 2](sutton-barto-chapter-13.pdf#page=2) · §13.2
[p. 4](sutton-barto-chapter-13.pdf#page=4) · §13.3
[p. 6](sutton-barto-chapter-13.pdf#page=6) · §13.4
[p. 9](sutton-barto-chapter-13.pdf#page=9). Level 4 reuses §13.5
[p. 11](sutton-barto-chapter-13.pdf#page=11) and §13.7
[p. 15](sutton-barto-chapter-13.pdf#page=15) from this same file.

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

## 4. Sutton & Barto, Chapter 9, §9.3 and §9.7

Local extract: [sutton-barto-chapter-9.pdf](sutton-barto-chapter-9.pdf), book
PDF pages 219–264. Extract page = book PDF page − 218.

§9.3 Stochastic-gradient and Semi-gradient Methods
[p. 4](sutton-barto-chapter-9.pdf#page=4) · §9.7 Nonlinear Function
Approximation: Artificial Neural Networks [p. 27](sutton-barto-chapter-9.pdf#page=27).

Why a parameterized function replaces the table, and the gradient step that
trains it. This is the background for the `nn/` façade bites.

## 5. Zai & Brown, *Deep Reinforcement Learning in Action*, Chapter 4

Local full book in `reference/` (gitignored; PDF page = printed page + 22):
§4.1 [p. 113](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=113) · §4.2 [p. 117](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=117) ·
§4.4 [p. 125](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=125) · App. A.3 Deep learning [p. 365](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=365).

REINFORCE on CartPole with a small policy network, the closest worked example
to this level. The book uses PyTorch and has no baseline, which makes it the
baseline-OFF arm of the variance panel.

## Optional DQN variant

The framework's optional DQN on CartPole reads *Deep RL in Action* §§3.2–3.4
(Q-network [p. 78](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=78), experience replay [p. 97](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=97), target
network [p. 102](../Deep%20Reinforcement%20Learning%20in%20Action%20%28Alexander%20Zai%2C%20Brandon%20Brown%29%20%28z-library.sk%2C%201lib.sk%2C%20z-lib.sk%29.pdf#page=102)) and Sutton & Barto §16.5, Human-level Video Game
Play: [sutton-barto-section-16-5.pdf](sutton-barto-section-16-5.pdf#page=1)
(book PDF pages 458–463; extract page = book PDF page − 457).
