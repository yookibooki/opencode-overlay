# OpenCode-Thrifty

OpenCode-Thrifty is a small OpenCode plugin that trims the context surface down to plain-text overrides.

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

## What It Changes

- Rewrites the built-in system prompt from `src/system.txt`
- Rewrites agent and session prompts from `src/prompts/agent/*.txt` and `src/prompts/session/*.txt`
- Rewrites the skill preamble from `src/prompts/system/skills.txt`
- Sets the session compaction prompt from `src/prompts/session/compaction.txt`
- Replaces tool descriptions from `src/tools/*.txt`
- Replaces tool schemas from `src/tools/*.json`
- Rewrites the skill tool preamble from `src/tools/skill.txt`
- Adds local `skills/` and `skill/` folders from the current directory or worktree to OpenCode's skill search paths

## Customize

- Edit the `.txt` files in `src/`
- See `docs/customization.md` for the file map and runtime flow
- See `coverage.md` for what the plugin does and does not override
- Run `bun run snapshots:update` when upstream OpenCode prompt text changes

## Generated Files

- `dist/`
- `src/prompts/_snapshots/`
- `src/prompts.manifest.json`

## Development

```bash
bun run build
bun run test
bun run snapshots:update
```
