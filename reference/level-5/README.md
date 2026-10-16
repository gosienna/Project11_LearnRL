# Level 5 — adaptive opponent

Off-policy replay (SAC), a human whose policy keeps changing, and a second head
that predicts the human’s next action. The critic target on screen is the SAC
backup: minimum of two target Qs, minus an entropy bonus.

## 1. OpenAI Spinning Up, Soft Actor-Critic

https://spinningup.openai.com/en/latest/algorithms/sac.html

Why this level cannot keep PPO’s “use each transition once” loop: the replay
buffer, the twin Q-functions, and the entropy term. Also the `tanh` squashing
correction on `log π(a|s)`, which the shared Gaussian head needs. The entropy
coefficient is the knob a difficulty controller can move to hold win-rate near
a target. The paper these notes compress is Haarnoja et al. 2018,
https://arxiv.org/abs/1801.01290

## 2. He et al., *Opponent Modeling in Deep Reinforcement Learning* (2016)

https://arxiv.org/abs/1609.05559

A second network trained to predict the opponent’s action, then used by the
policy. That is the ghost overlay: `p̂(aʰ|s)` fit by supervised learning on the
human’s real inputs, not by reward. Read the architecture and the
non-stationary-opponent experiments; the quiz-bowl domain can be skipped.

## 3. Papoudakis et al., *Dealing with Non-Stationarity in Multi-Agent Deep Reinforcement Learning* (2019)

https://arxiv.org/abs/1906.04737

A short survey of what breaks when the other player learns too. Read the
problem statement and the opponent-modelling section. Centralized training,
communication, and meta-learning are out of scope; this demo has one learned
agent and one human.
