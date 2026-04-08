# OpenCode-Thrifty

OpenCode-Thrifty is a small OpenCode plugin that trims the context surface down to plain-text overrides.

## What It Changes

- Rewrites the built-in system prompt from `src/system.txt`
- Rewrites agent and session prompts from `src/prompts/agent/*.txt` and `src/prompts/session/*.txt`
- Sets the session compaction prompt from `src/prompts/session/compaction.txt`
- Replaces tool descriptions from `src/tools/*.txt`
- Adds local `skills/` and `skill/` folders from the current directory or worktree to OpenCode's skill search paths

## Install

```bash
opencode plugin opencode-thrifty --global
```

Or add this to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-thrifty"]
}
```

## Customize

- Edit the `.txt` files in `src/`
- See `docs/customization.md` for the file map and runtime flow
- Run `bun run snapshots:update` when upstream OpenCode prompt text changes

## Development

```bash
bun run build
bun run test
bun run snapshots:update
```

## Generated Files

- `dist/`
- `src/prompts/_snapshots/`
- `src/prompts.manifest.json`
