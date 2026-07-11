# AGENTS.md

## Cursor Cloud specific instructions

Wheel of Tim is a single **Next.js 16 (App Router) + React 19** app. It is fully
client-side: names are persisted in the browser's `localStorage`, and there is no
backend, database, or environment variable to configure. The only service to run is
the Next.js dev server.

### Toolchain (non-obvious)

- The project pins **Node 24.x** and **pnpm 10.31.0** (`engines` in `package.json`),
  but the base VM's default `node` (`/exec-daemon/node`) is Node 22. Node 24 is
  installed via `nvm` and set as the default alias, and pnpm is provided through
  Corepack. The startup update script re-activates both, so `node`/`pnpm` resolve to
  the correct versions in normal shells.
- `pnpm install` prints a "Ignored build scripts: esbuild, sharp" warning. This is
  expected and harmless — tests, build, and the dev server all work without running
  `pnpm approve-builds`.

### Commands

Standard scripts are in `package.json` / `README.md`:

- Dev server: `pnpm dev` → http://localhost:3000
- Tests: `pnpm test` (Vitest, jsdom) — 2 files / 15 tests
- Build: `pnpm build` (Next.js/Turbopack production build)

There is **no lint script** in this repo; CI (`.github/workflows/ci.yml`) only runs
`pnpm test` then `pnpm build`.
