# Reference

Short reading lists for the five levels in `framework/rl-web-framework.md`.
Each level has its own folder and at most three sources.

The shared textbook is Sutton and Barto, *Reinforcement Learning: An Introduction*
(2nd ed.), already in this folder:

`Reinforcement Learning An Introduction (Adaptive Computation and Machine Learning series).pdf`

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
| [level-3/sutton-barto-chapter-13.pdf](level-3/sutton-barto-chapter-13.pdf) | 343–362 | book − 342 | L3, L4 (§13.5, §13.7) |

Per-section links are in each `framework/level-N-bites.md` page map. Levels 4
and 5 lean on papers and blog posts linked from their own README.
