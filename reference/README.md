# Reference

Short reading lists for the five levels in `framework/rl-web-framework.md`.
Each level has its own folder, up to three primary sources, and pointers into
the two shared books.

Both books are in this folder and gitignored:

- Sutton and Barto, *Reinforcement Learning: An Introduction* (2nd ed.), the
  concept source:
  `Reinforcement Learning An Introduction (Adaptive Computation and Machine Learning series).pdf`.
  Bites link the tracked per-chapter extracts below.
- Zai and Brown, *Deep Reinforcement Learning in Action* (Manning, 2020), the
  code-first companion in PyTorch:
  `Deep Reinforcement Learning in Action (Alexander Zai, Brandon Brown) (z-library.sk, 1lib.sk, z-lib.sk).pdf`.
  It has no tracked extracts. Bites link the full local PDF, so those links
  work only where the book exists.

## Agent tooling (isolated)

Do not install system-wide. See `.cursor/skills/instructor/SKILL.md` →
**Working with the textbook PDF**.

- Page images: `pixi.toml` + `~/.pixi/bin/pixi run pdftoppm` → PNGs in
  `scratchpad/` (gitignored, as is `.pixi/`).
- Text search: `pyproject.toml` / `uv.lock` (PyMuPDF 1.x) → `uv sync` once,
  then `~/.local/bin/uv run python -I` with a scratchpad script
  (`pymupdf.open(path)[n-1].get_text()`, `doc.get_toc()`). `.venv/` is
  gitignored.

| Level | Folder | New concept |
|-------|--------|-------------|
| 1 | [level-1/](level-1/README.md) | Exploration vs. exploitation |
| 2 | [level-2/](level-2/README.md) | State, transitions, TD bootstrapping |
| 3 | [level-3/](level-3/README.md) | Function approximation, policy gradients |
| 4 | [level-4/](level-4/README.md) | Actor-critic, GAE, continuous control |
| 5 | [level-5/](level-5/README.md) | Off-policy replay, non-stationarity, human-in-the-loop |

## Page map

PDF page numbers (what a viewer shows), not printed page numbers. In the full
book, PDF page = printed page + 22. The full book is gitignored, so bites link
the tracked per-chapter extracts.

| Extract | Book PDF pages | Extract page = | Used by |
|---------|----------------|----------------|---------|
| [level-1/sutton-barto-chapter-2.pdf](level-1/sutton-barto-chapter-2.pdf) | 45–67 | book − 44 | L1 |
| [level-2/sutton-barto-chapter-3.pdf](level-2/sutton-barto-chapter-3.pdf) | 69–94 | book − 68 | L2 |
| [level-2/sutton-barto-chapter-6.pdf](level-2/sutton-barto-chapter-6.pdf) | 141–162 | book − 140 | L2, L5 (§6.7) |
| [level-3/sutton-barto-chapter-9.pdf](level-3/sutton-barto-chapter-9.pdf) | 219–264 | book − 218 | L3 (§9.3, §9.7) |
| [level-5/sutton-barto-chapter-11.pdf](level-5/sutton-barto-chapter-11.pdf) | 279–308 | book − 278 | L5 (§11.3) |
| [level-4/sutton-barto-chapter-12.pdf](level-4/sutton-barto-chapter-12.pdf) | 309–342 | book − 308 | L4 (§12.1) |
| [level-3/sutton-barto-chapter-13.pdf](level-3/sutton-barto-chapter-13.pdf) | 343–362 | book − 342 | L3, L4 (§13.5, §13.7) |
| [level-3/sutton-barto-section-16-5.pdf](level-3/sutton-barto-section-16-5.pdf) | 458–463 | book − 457 | L3 optional DQN, L5 |

### *Deep RL in Action* page map

PDF page = printed page + 22. No extracts; link the full PDF.

| Section | PDF page | Used by |
|---------|----------|---------|
| §2.2 Solving the multi-arm bandit | 50 | L1 |
| §2.6 The Markov property · §2.7 Value and policy functions | 69 · 71 | L2 |
| §3.1 The Q function · §3.2 Navigating with Q-learning | 77 · 78 | L2, L3 optional DQN |
| §3.3 Experience replay · §3.4 Target network | 97 · 102 | L3 optional DQN, L5 |
| §4.1 Policy network · §4.2 Policy gradient · §4.4 REINFORCE | 113 · 117 · 125 | L3 |
| §5.1 Actor-critic · §5.2 Distributed training · §5.3 A2C · §5.4 N-step | 135 · 140 · 145 · 154 | L4 |
| §9.1 From one to many agents · §9.5 Mixed cooperative-competitive | 266 · 293 | L5 |
| §10.5 Double Q-learning | 339 | L5 |
| §11.2.2 PPO (why the book skips it) | 354 | L4 |
| App. A.3 Deep learning | 365 | L3 |

Per-section links are in each `framework/level-N-bites.md` page map. Levels 4
and 5 lean on papers and blog posts linked from their own README.
