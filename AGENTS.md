# AGENTS.md

AI coding agent instructions for opencode-thrifty.

## What this project does

Reduces OpenCode's context layer: smaller prompts, fewer unnecessary tokens, user-editable overrides through `src/`.

## Install

Users clone the repo to a stable location, edit `src/`, build, and register the local path as an OpenCode plugin.

## Before you start

Read `src/` first. This is the main customization layer. Most meaningful behavior lives in text files, not code.

## Guiding principles

- Preserve the file-based customization model
- Do not move user-editable behavior into code unless necessary
- Learn from `https://github.com/alvinunreal/oh-my-opencode-slim` for design ideas, but adapt — do not copy blindly

## File map

```
src/index.ts                        — main plugin entry
src/system.txt                      — global system override
src/prompts/agent/*.txt             — agent prompt overrides
src/prompts/session/*.txt           — session prompt overrides
src/prompts/system/skills.txt       — skill preamble override
src/prompts/session/compaction.txt  — compaction prompt override
src/tools/*.txt                     — tool description overrides
src/tools/*.json                    — tool schema overrides
src/prompts/_snapshots/**           — upstream prompt snapshots (generated)
src/prompts.manifest.json           — generated manifest of tracked prompt ids
scripts/update-snapshots.ts         — refreshes snapshots and manifest
coverage.md                         — current override coverage map
plan.md                             — maintainer direction
```

## Do not hand-edit

- `dist/`
- `src/prompts/_snapshots/`
- `src/prompts.manifest.json`

These are generated. Edit source files and rebuild instead.

## Common tasks

```bash
bun run build              # compile + copy runtime assets to dist/
bun run test               # run tests
bun run snapshots:update   # refresh upstream snapshots after OpenCode changes
```

Use Bun. Not npm. Not yarn.

## Runtime

- OpenCode loads `dist/index.js`
- `package.json` must continue to export `dist/index.js`
- Build copies prompt and tool assets from `src/` into `dist/`

Active hooks:
- `config`
- `experimental.chat.system.transform`
- `experimental.chat.messages.transform`
- `experimental.session.compacting`
- `tool.definition`

## How overrides work

- Prompt overrides are matched to upstream snapshots by filename
- Replacement is prefix-based: an override replaces the opening part of an upstream prompt
- Tool descriptions come from matching `src/tools/*.txt` files

Keep overrides visible and file-based. Prefer an override file over hidden internal logic whenever possible.

## Constraints

- TypeScript, strict mode
- Bun as the runtime and package manager
- Keep package versions in the `0.0.x` range
- `AGENTS.md` is intentionally maintained — keep it accurate

## Reference (read-only)

- OpenCode repo: `https://github.com/anomalyco/opencode`
- Plugin docs: `https://opencode.ai/docs/plugins`
- Design reference: `https://github.com/alvinunreal/oh-my-opencode-slim`

Read from them. Do not edit them.
