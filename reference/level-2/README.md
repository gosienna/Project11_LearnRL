# Level 2 — Cliff Walking, tabular Q-learning

State, transitions, discounting, and one-step TD bootstrapping. The headline
comparison is Q-learning’s cliff-edge path versus SARSA’s safer detour.

## 1. Sutton & Barto, Chapters 3 and 6

Full book in `reference/`:
`Reinforcement Learning An Introduction (Adaptive Computation and Machine Learning series).pdf`

- Chapter 3, §§3.1–3.6 (pp. 47–67): agent–environment interface, return, policy,
  and `q(s,a)`. This is where “state” and “transition” enter.
- Chapter 6, §§6.1 and 6.4–6.6 (from p. 119): TD error, SARSA, Q-learning,
  Expected SARSA.
- Example 6.6, Cliff Walking (about pp. 132–133): the grid this level’s
  acceptance test copies. Reward −1 per step, −100 on the cliff, ε-greedy.
  Q-learning learns the optimal edge path and still falls while exploring;
  SARSA learns the long safe path.

## 2. Lilian Weng, *A (Long) Peek into Reinforcement Learning*

https://lilianweng.github.io/posts/2018-02-19-rl-overview/

Read the sections on the Bellman equations, temporal-difference learning, SARSA,
and Q-learning. Skip the deep-RL half (DQN onward); that machinery is level 5.

## 3. David Silver, Lectures 4 and 5

- Lecture 4, Model-Free Prediction (TD bootstrapping): https://www.youtube.com/watch?v=PnHCvfgC_ZA
- Lecture 5, Model-Free Control (SARSA vs Q-learning): https://www.youtube.com/watch?v=0g4j2k_Ggc4

Course index: http://www.davidsilver.uk/teaching/

Lecture 4 is the TD target `r + γV(s')`. Lecture 5 is the on-policy / off-policy
toggle the demo puts on one button. The standard 4×12 cliff layout those
lectures use is specified at
https://gymnasium.farama.org/environments/toy_text/cliff_walking/
