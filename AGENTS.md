# AGENTS.md

AI coding agent instructions for opencode-overlay.

## What this project does

Reduces OpenCode's context layer: smaller prompts, fewer unnecessary tokens, user-editable overrides through `src/`.

## Install

Users clone the repo to a stable location, edit `src/`, build, and register the local path as an OpenCode plugin.

## Before you start

Read `src/` first. This is the main customization layer. Most meaningful behavior lives in text files, not code.

## Guiding principles

- Preserve the file-based customization model
- Do not move user-editable behavior into code unless necessary

## File map

```
src/index.ts                        — main plugin entry
src/system.txt                      — global system override
src/agent/*.txt                     — agent prompt overrides
src/*.txt                           — session prompt overrides and shared text overrides
src/skills.txt                      — skill preamble override
src/compaction.txt                  — compaction prompt override
src/tool/*.txt                      — tool description overrides
src/tool/*.json                     — tool schema overrides
src/_snapshots/**                   — upstream prompt snapshots (generated)
src/prompts.manifest.json           — generated manifest of tracked prompt ids
scripts/update-snapshots.ts         — refreshes snapshots and manifest
```

## Do not hand-edit

- `dist/`
- `src/_snapshots/`
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
- Tool descriptions come from matching `src/tool/*.txt` files

Keep overrides visible and file-based. Prefer an override file over hidden internal logic whenever possible.

## Constraints

- TypeScript, strict mode
- Bun as the runtime and package manager
- Keep package versions in the `0.0.x` range
- `AGENTS.md` is intentionally maintained — keep it accurate

## Reference (read-only)

- OpenCode repo: `/home/dev/gitops/opencode`
- Plugin docs: `/home/dev/gitops/opencode/packages/web/src/content/docs/plugins.mdx`

ALWAYS READ REFERENCE FIRST.
