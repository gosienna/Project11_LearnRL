# Tooling (not in Sutton & Barto)

The bandit chapter never mentions npm. This project still needs one root
`package.json` so every later bite can run the same two commands: `npm test`
(fast red–green loop) and `npm run dev` (the site).

## Why the root, why `student/`

Everything you implement lives under `student/`. The root file is only the npm
entry: its scripts call Vite and Vitest against that folder. See
[framework/rl-web-framework.md §2.8](../../framework/rl-web-framework.md)
(repository layout) and
[framework/rl-web-tdd-plan.md §7](../../framework/rl-web-tdd-plan.md)
(script names).

## The four scripts

| Script | Role |
|--------|------|
| `dev` | Vite serves the site |
| `test` | Vitest, fast suite (exclude `*.slow.test.js`) |
| `test:slow` | Vitest, only the slow files, long timeout |
| `test:all` | fast then slow |

`vite` and `vitest` are **devDependencies**. Until you write a `*.test.js`
file, `npm test` should start Vitest and report that it found no tests — that
is the success signal for the first tooling bite. "command not found" means
the scripts or install are wrong.
