# OpenCode-Thrifty

Customize OpenCode's default context layer by editing plain text files.

## Setup

**1. Clone the repo** to a stable location:

```sh
INSTALL_DIR="/path/you-will-keep/opencode-thrifty"
git clone --depth 1 https://github.com/yookibooki/opencode-thrifty "$INSTALL_DIR"
cd "$INSTALL_DIR"
bun install
```

**2. Edit** the files in `src/` to your liking.

**3. Build and register the plugin:**

```sh
bun run build
opencode plugin "$INSTALL_DIR"
```

Add `--global` only if you want to register it for your personal OpenCode setup instead of the current project.

**4. Restart OpenCode if it's running.**

## Edit points

- `src/system.txt`
- `src/agent/*.txt`
- `src/*.txt`
- `src/skills.txt`
- `src/compaction.txt`
- `src/tool/*.txt`
- `src/tool/*.json`

## How it works

- Snapshots live in `src/_snapshots/**` and are generated.
- `src/system.txt` is compared against every built-in system snapshot.
- `src/*.txt` matches session and named system snapshot names.
- `src/agent/*.txt` matches agent snapshot names.
- Tool descriptions and schemas come from matching `src/tool/*.txt` and `src/tool/*.json` files.
- `bun run snapshots:update` refreshes `src/_snapshots/**` and `src/prompts.manifest.json`.
- Local `skills/` and `skill/` folders are appended from `directory` and `worktree`.

## Notes

- Missing optional files and directories are ignored; unreadable paths still fail fast.
- Build output goes to `dist/`.

## Development

- `bun run build`
- `bun run test`
- `bun run snapshots:update` when upstream OpenCode prompt text changes
