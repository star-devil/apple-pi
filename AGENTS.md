# AGENTS.md

Tauri 2 desktop app. Rust backend (`src-tauri/`) + React 19 frontend (`src/`). Packaged with pnpm.

> The `README.md` is **stale** — it claims "原生 HTML/CSS/TS, no frontend framework". The actual frontend is React 19 + TanStack Router + shadcn/ui (Radix + Tailwind). Trust the code over the README.

## Commands

```bash
pnpm install          # install JS deps (Rust deps pulled by cargo on first build)
pnpm tauri dev        # full app: runs vite dev server + Rust backend, opens desktop window
pnpm dev              # frontend only (browser, no Tauri commands available)
pnpm build            # frontend only: tsc typecheck + vite build -> dist/
pnpm tauri build      # production bundle -> src-tauri/target/release/bundle/
pnpm fetch:node       # download platform node binary into src-tauri/binaries/ (required before tauri dev/build once sidecar lands)
```

There is no `lint`, `test`, or `format` script configured. Typecheck via `pnpm build` (runs `tsc`) or `npx tsc --noEmit`.

> Full implementation roadmap for the Pi sidecar integration lives in `docs/implementation-plan.md`.

## Architecture

- **Frontend entry**: `src/main.tsx` -> mounts `RouterProvider` from `@tanstack/react-router`.
- **Routing**: file-based. Route files live in `src/routes/` (`__root.tsx`, `index.tsx`, `mcp.tsx`, `models.tsx`, `shortcuts.tsx`, `skills.tsx`). The `@tanstack/router-plugin` (registered in `vite.config.ts`) **auto-generates `src/routeTree.gen.ts`** on dev/build. Do NOT hand-edit `routeTree.gen.ts` — it is regenerated and overwritten. To add a route, create a new file in `src/routes/`.
- **UI**: shadcn/ui (config in `components.json`, `aliases.ui` = `@/components/ui`). Add components via `npx shadcn@latest add <name>`. `tailwind.config.js` uses a Material 3-ish token palette via CSS variables in `src/index.css`.
- **Path alias**: `@/*` -> `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).
- **Backend entry**: `src-tauri/src/main.rs` calls `apple_pi_lib::run()` in `lib.rs`. Tauri commands are registered in `invoke_handler!` there. `tauri.conf.json` wires `beforeDevCommand: pnpm dev` and `beforeBuildCommand: pnpm build`, so Tauri manages the frontend for you.

## Pi sidecar (agent runtime)

The agent runs via the [Pi Coding Agent](https://github.com/earendil-works/pi) CLI as a **Node sidecar process** in RPC mode (`pi --mode rpc`). Pi is a pure Node/TS SDK with no Rust bindings, so it cannot run in-process — Tauri spawns a `node-${target}` binary (bundled via `externalBin`) that hosts `@earendil-works/pi-coding-agent`.

- **Protocol**: stdin/stdout JSONL (`\n`-delimited). Rust (`src-tauri/src/sidecar.rs` + `rpc.rs`) writes commands to stdin, reads events from stdout, and bridges them to the frontend via `invoke('pi_*')` + `emit('pi:event')`.
- **Data isolation**: Pi data lives under `<app_data_dir>/apple-pi/.pi/` via the `PI_CODING_AGENT_DIR` env var — do NOT use the global `~/.pi/`. Also set `PI_OFFLINE=1`, `PI_TELEMETRY=0`, `PI_SKIP_VERSION_CHECK=1`.
- **JSONL parsing**: split ONLY on `\n`. Do not use `readline`-style parsers that also break on `U+2028`/`U+2029` — they corrupt Pi JSON strings. Rust's `BufRead::lines()` is safe.
- **Node binary**: fetched by `pnpm fetch:node` into `src-tauri/binaries/` (gitignored). Naming follows Tauri externalBin convention (`node-aarch64-apple-darwin`, etc.).
- **No MCP built-in**: Pi's philosophy uses Skills instead. MCP support requires a Pi extension or SDK-level integration (v2+).

## Gotchas

- **Fixed dev port 1420** (`vite.config.ts` `strictPort: true`). Tauri expects this URL; do not change it without updating `tauri.conf.json` `devUrl`.
- **`src-tauri/` is ignored by Vite's file watcher** — changing Rust code will not trigger HMR. Restart `pnpm tauri dev` for backend changes.
- **`src-tauri/target/`** is a Rust build cache — large, gitignored, never commit it.
- `tsconfig.json` has `noUnusedLocals` and `noUnusedParameters` on — unused imports/vars fail the build.
- Tauri permissions are scoped in `src-tauri/capabilities/default.json` (currently `core:default` + `opener:default`). New Tauri APIs/plugins need permissions added here or IPC calls will be denied at runtime.
- `vite.config.ts` sets `envPrefix: ['VITE_', 'TAURI_ENV_*']` so Tauri-injected env vars are reachable in frontend code.
