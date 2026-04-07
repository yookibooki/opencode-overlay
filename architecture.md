# Architecture V2

OpenCode-thrifty is a Bun-native OpenCode plugin that rewrites prompt text and tool metadata at runtime without changing OpenCode core.

## What lives where

- `src/index.ts` is the plugin entry point.
- `src/system.txt` is the global system-prompt override.
- `src/prompts.manifest.json` tracks the upstream prompt IDs this repo mirrors.
- `src/prompts/_snapshots/**` stores upstream copies used for exact prefix matching.
- `src/prompts/agent/*.txt` and `src/prompts/session/*.txt` are the visible overrides.
- `src/tools/*.txt` are description-only tool overrides.
- `src/tools/*.ts` are real runtime tools.
- `scripts/update-snapshots.ts` regenerates the snapshot tree from upstream.

## Runtime model

- OpenCode loads the plugin from `src/index.ts`; there is no build artifact.
- `server()` eagerly reads the manifest, snapshots, overrides, tool descriptions, and runtime tool modules.
- Missing files are tolerated and simply disable the corresponding override.
- The plugin returns hook handlers for:
  - `experimental.chat.system.transform`
  - `experimental.chat.messages.transform`
  - `experimental.session.compacting`
  - `tool.definition`
  - `tool`
- Only text segments are rewritten; non-text message parts are left alone.

## Prompt architecture

### System prompts

- `src/system.txt` replaces any matching upstream system prompt prefix from the tracked system snapshots.
- Matching is prefix-based and sorted longest-first so more specific prompts win.
- The current system snapshot set is: `anthropic`, `beast`, `codex`, `default`, `gemini`, `gpt`, `kimi`, `trinity`.
- If `src/system.txt` is absent, system rewriting is disabled.

### Agent prompts

- Agent overrides activate only when both the upstream snapshot and the visible override file exist.
- Active agent overrides are:
  - `src/prompts/agent/compaction.txt`
  - `src/prompts/agent/explore.txt`
  - `src/prompts/agent/summary.txt`
  - `src/prompts/agent/title.txt`
- `src/prompts/agent/generate.txt` is tracked in the manifest but currently dormant because no visible override exists.

### Session prompts

- Session overrides use the same snapshot/override pairing, except for compaction.
- Active session overrides are:
  - `src/prompts/session/build-switch.txt`
  - `src/prompts/session/compaction.txt`
- `src/prompts/session/compaction.txt` is loaded directly into the session-compacting hook rather than via prefix replacement.
- Tracked but currently dormant session prompts include:
  - `session/plan`
  - `session/max-steps`
  - `session/copilot-gpt-5`
  - `session/plan-reminder-anthropic`
- `max-steps` is also noted in the README as inlined in OpenCode core, so it is not currently hookable.

## Tool architecture

- `src/tools/*.txt` only changes the tool description shown to the model.
- `tool.definition` updates metadata at load time; it does not change implementation or parameters.
- `src/tools/*.ts` define actual plugin tools.
- `skill.ts` discovers `SKILL.md` files across the worktree and common user config locations, loads frontmatter/content, and returns the selected skill wrapped in `<skill_content>`.
- `invalid.ts` returns a clear validation error string for invalid tool usage.
- Everything else under `src/tools/*.txt` is a description override for built-in or helper tools such as `read`, `write`, `bash`, `glob`, `grep`, `task`, and `question`.

## Snapshot maintenance

- `scripts/update-snapshots.ts` fetches the upstream tree from `anomalyco/opencode@dev`.
- It rebuilds `src/prompts.manifest.json` and the entire `src/prompts/_snapshots/` tree.
- Snapshots are generated compatibility data; do not hand-edit them unless intentionally diverging.
- Run `bun run snapshots:update` when upstream prompt text changes.

## Packaging

- `package.json` exports `src/index.ts` directly for both `bun` and `import`.
- There is no build step.
- `zod` is the only runtime dependency; TypeScript is checked with `bun run check`.

## Change guide

- Change the system prompt: edit `src/system.txt`.
- Change an active prompt override: edit the matching file in `src/prompts/agent/` or `src/prompts/session/`.
- Activate a dormant prompt: add the visible override file with the exact manifest name.
- Add a real runtime tool: create `src/tools/<name>.ts`.
- Change only a tool description: edit `src/tools/<name>.txt`.
- Refresh upstream snapshots: `bun run snapshots:update`.
- Validate the package: `bun run check`.

## Why snapshots exist

- OpenCode exposes assembled prompt text to the plugin, not the original prompt filename.
- Snapshots let this plugin recognize upstream text and replace it safely.
- This repo is a compatibility shim until OpenCode exposes prompt-ID hooks.
