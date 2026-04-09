# OpenCode Overlay

[![Discussions](https://img.shields.io/github/discussions/yookibooki/opencode-overlay?logo=github)](https://github.com/yookibooki/opencode-overlay/discussions)
[![Issues](https://img.shields.io/github/issues/yookibooki/opencode-overlay?logo=github)](https://github.com/yookibooki/opencode-overlay/issues)
[![License](https://img.shields.io/github/license/yookibooki/opencode-overlay)](LICENSE)

Customize OpenCode's default context layer by editing plain text files.

## Setup

**1. Clone the repo** to a stable location:

```sh
INSTALL_DIR="/path/you-will-keep/opencode-overlay"
git clone --depth 1 https://github.com/yookibooki/opencode-overlay "$INSTALL_DIR"
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

## Community and maintenance

- Use [Discussions](https://github.com/yookibooki/opencode-overlay/discussions) for ideas, design feedback, and questions.
- Use Issues for bugs, regressions, or missing override coverage.
- Keep changes file-based; prefer `src/` overrides over hidden logic.
- Update `README.md` or `AGENTS.md` when workflow expectations change.

## Notes

- Missing optional files and directories are ignored; unreadable paths still fail fast.
- Build output goes to `dist/`.
- Generated files should not be edited by hand.

## Development

- `bun run build`
- `bun run test`
- `bun run check`
- `bun run snapshots:update` when upstream OpenCode prompt text changes
