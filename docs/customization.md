# Customization

OpenCode-Thrifty is intentionally file-based. Edit text files in `src/` instead of adding code when you can.

## What To Edit

- `src/system.txt`
- `src/prompts/agent/*.txt`
- `src/prompts/session/*.txt`
- `src/prompts/system/skills.txt`
- `src/prompts/session/compaction.txt`
- `src/tools/*.txt`
- `src/tools/*.json`

## How Matching Works

- The plugin scans `src/prompts/_snapshots/agent`, `src/prompts/_snapshots/session`, and `src/prompts/_snapshots/system`
- `src/system.txt` is a shared override that is compared against every built-in system snapshot
- Agent and session overrides apply when the snapshot file and the local `.txt` file share the same name
- Replacement is prefix-based, so you can keep the upstream prompt tail intact if you only need to change the opening instructions
- The longest matching snapshot wins
- `src/prompts/system/skills.txt` edits the skill preamble while keeping OpenCode's live skill list
- Tool descriptions are taken directly from the matching `src/tools/*.txt` file
- Tool schemas are taken directly from the matching `src/tools/*.json` file
- Tool schema files must contain a JSON object at the top level
- `src/tools/skill.txt` edits the skill tool preamble while keeping OpenCode's live skill list

## Skills

- If `directory` and `worktree` are available, the plugin appends `skills/` and `skill/` from both roots to OpenCode's built-in skill search paths
- This keeps project-local skills visible without extra configuration

## Refreshing Snapshots

- Run `bun run snapshots:update` when upstream OpenCode prompt text changes
- The command refreshes `src/prompts/_snapshots/**` and `src/prompts.manifest.json`
- Treat those files as generated bookkeeping

## Notes

- Missing optional files are ignored
- The plugin remains usable with only the bundled prompt overrides and tool override files
- See `coverage.md` for the current override map
- See `plan.md` for the maintainer direction
