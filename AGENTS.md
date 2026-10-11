# AGENTS.md

Project instructions for every coding agent (Claude Code, Codex, Cursor).

## Project

Wheel of Tim is a single **Next.js 16 (App Router) + React 19** app. It is fully
client-side: names are persisted in the browser's `localStorage`, and there is no
backend, database or environment variable to configure. The only service to run
is the Next.js dev server.

## Toolchain

- **Node 24.x and pnpm 10.31.0**, pinned in `package.json` (`engines` and
  `packageManager`). pnpm comes from Corepack (`corepack enable`).
- A `preinstall` guard (`scripts/enforce-pnpm.cjs`) rejects npm and yarn.
- `pnpm install` prints "Ignored build scripts: esbuild, sharp". This is
  expected: tests, build and the dev server all work without
  `pnpm approve-builds`.

## Commands

- Dev server: `pnpm dev` → http://localhost:3000
- Tests: `pnpm test` (Vitest, jsdom)
- Type check: `pnpm typecheck`
- Production build: `pnpm build`

There is **no lint script**. CI (`.github/workflows/ci.yml`) runs `pnpm test`
then `pnpm build` on Node 24, so run both before handing off a change.

## Agent sessions

- **Cloud sessions** whose image lacks Node 24 get it from
  `.claude/hooks/session-start.sh`, which also enables Corepack and installs
  dependencies. It does nothing on a local machine.
- **Shared Claude Code permissions** are in `.claude/settings.json`; personal
  overrides go in the ignored `.claude/settings.local.json`.
- **GitHub in Claude Code cloud sessions** is REST-only: `gh issue` and
  `gh pr view` fail there, so use `gh api repos/jeasmith/wheeloftim/...`.
