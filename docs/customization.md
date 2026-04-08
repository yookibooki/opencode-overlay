# Customization

OpenCode-Thrifty is intentionally file-based. Edit text files in `src/` instead of adding code when you can.

## What To Edit

- `src/system.txt`
- `src/prompts/agent/*.txt`
- `src/prompts/session/*.txt`
- `src/prompts/session/compaction.txt`
- `src/tools/*.txt`

## How Matching Works

- The plugin scans `src/prompts/_snapshots/agent`, `src/prompts/_snapshots/session`, and `src/prompts/_snapshots/system`
- An override only applies when the snapshot file and the local `.txt` file share the same name
- Replacement is prefix-based, so you can keep the upstream prompt tail intact if you only need to change the opening instructions
- Tool descriptions are taken directly from the matching `src/tools/*.txt` file

## Skills

- If `directory` and `worktree` are available, the plugin appends `skills/` and `skill/` from both roots to OpenCode's built-in skill search paths
- This keeps project-local skills visible without extra configuration

## Refreshing Snapshots

- Run `bun run snapshots:update` when upstream OpenCode prompt text changes
- The command refreshes `src/prompts/_snapshots/**` and `src/prompts.manifest.json`
- Treat those files as generated bookkeeping

## Notes

- Missing optional files are ignored
- The plugin remains usable with only the bundled prompt overrides and tool description files
