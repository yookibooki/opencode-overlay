# OpenCode-Thrifty Code Map

## Responsibility

- `src/index.ts`: plugin entry; loads text overrides and wires hooks
- `src/system.txt`: global system override
- `src/prompts/agent/*.txt` and `src/prompts/session/*.txt`: override files paired with upstream snapshots
- `src/prompts/session/compaction.txt`: dedicated compaction prompt
- `src/tools/*.txt`: tool descriptions
- `src/prompts/_snapshots/**`: generated upstream copies used to pair override files
- `scripts/update-snapshots.ts`: refreshes snapshots and `src/prompts.manifest.json`

## Design

- Runtime discovery is filename-based: the plugin scans snapshot directories and only applies overrides when both builtin and local files exist
- Prompt replacement is prefix-based, so the override can change the opening instructions without rewriting the whole upstream prompt
- Missing files are treated as absent overrides, which keeps startup simple and the install path minimal
- `config` only mutates `skills.paths`, appending local `skills/` and `skill/` folders for whichever of `directory` and `worktree` are available

## Flow

- `server()` reads prompt and tool text once
- `config` merges extra skill roots
- `experimental.chat.system.transform` rewrites built-in system prompts
- `experimental.chat.messages.transform` rewrites session message text parts
- `experimental.session.compacting` injects the compaction prompt
- `tool.definition` swaps in local tool descriptions

## Integration

- `dist/index.js` is the published runtime bundle
- `dist/index.d.ts` provides types
- `README.md` explains the supported edit points for humans
