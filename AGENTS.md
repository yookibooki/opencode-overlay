# OpenCode-Thrifty Maintainers Guide

## What this project is
OpenCode-Thrifty is a small plugin for the OpenCode AI coding agent.

It exists to reduce unnecessary context. OpenCode can send more prompt and tool context than some users want. OpenCode-Thrifty gives users a leaner prompt, lower token usage, and clearer control over what gets sent to the model.

## Project goal
Keep this project small, practical, and easy to understand.

A good change should make the plugin easier to use, easier to customize, or make the architecture design better. Do not add complexity unless it clearly earns its place.

## Install
The primary install flow must work out of the box:

```bash
opencode plugin opencode-thrifty --global
````

Or add it to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-thrifty"]
}
```

`opencode-thrifty` is published as an npm package, but this project itself prefers Bun for development.

## Customize

Most customization should happen in `src/`.

Main edit points:

- `src/system.txt`
- `src/prompts/agent/*.txt`
- `src/prompts/session/*.txt`
- `src/tools/*.txt`

For deeper customization, clone the repo into a practical local workspace and edit the text files directly:

```bash
git clone --depth 1 https://github.com/yookibooki/opencode-thrifty "$HOME/gitops/opencode-thrifty"
```

This project should support two kinds of users equally well:

1. users who install the package and want a minimal plugin that works immediately
2. users who clone the repo and want direct control over the context layer through `src/`

## Preferences

- Use Bun and TypeScript
- Prefer strict TypeScript
- Prefer Bun workflows over npm or yarn
- Keep package versions in the `0.0.x` range
- Treat `src/` as the main customization layer
- Keep customization visible and file-based when possible

## Constraints

Do not hand-edit generated files unless there is a very good reason:

- `dist/`
- `src/prompts/_snapshots/`
- `src/prompts.manifest.json`

Notes:

- `AGENTS.md` is intentionally maintained for AI coding agent instructions
- `package.json` should continue to point at `dist/`

## How overrides work

Keep overrides visible and user-editable whenever possible.

When OpenCode exposes a context surface that can reasonably be customized, prefer an override file over hidden internal logic.

Useful behavior to remember:

- prompt overrides are paired to upstream snapshots by filename
- replacement is prefix-based, so an override can replace only the opening part of an upstream prompt
- tool descriptions come from matching `src/tools/*.txt` files

## What AI coding agents need to know

- Read `src/` first
- Prefer minimal, useful edits
- Preserve the out-of-the-box install flow
- Preserve the file-based customization model
- Do not move user-editable behavior into code unless necessary
- Prefer learning from `@oh-my-opencode-slim/`, but adapt its ideas to this project instead of copying blindly

## File map

- `src/index.ts` — main plugin entry
- `src/system.txt` — global system override
- `src/prompts/agent/*.txt` — agent prompt overrides
- `src/prompts/session/*.txt` — session prompt overrides
- `src/prompts/session/compaction.txt` — compaction prompt override
- `src/tools/*.txt` — tool description overrides
- `src/prompts/_snapshots/**` — upstream prompt snapshots used for matching
- `src/prompts.manifest.json` — generated manifest of tracked prompt ids
- `scripts/update-snapshots.ts` — refreshes snapshots and manifest

## Runtime notes

- OpenCode loads `dist/index.js`
- Build copies prompt and tool assets into `dist/`
- `package.json` exports `dist/index.js`
- `bun run build` compiles the runtime and declarations, then copies runtime assets
- The plugin uses these hooks:

  - `config`
  - `experimental.chat.system.transform`
  - `experimental.chat.messages.transform`
  - `experimental.session.compacting`
  - `tool.definition`

## Common tasks

### Refresh snapshots

Run this when upstream OpenCode prompt text changes:

```bash
bun run snapshots:update
```

### Build

```bash
bun run build
```

### Test

```bash
bun run test
```

## Reference material

These are useful for understanding upstream behavior, but they are reference-only:

- OpenCode source in `/home/dev/gitops/opencode`
- OpenCode repo: `https://github.com/anomalyco/opencode`
- Plugins documentation in `/home/dev/gitops/opencode/packages/web/src/content/docs/plugins.mdx`
- OpenCode plugin docs: `https://opencode.ai/docs/plugins/`
- `@oh-my-opencode-slim/` as a design reference

Read from them. Learn from them. Do not edit them.

## Final note

When in doubt, prefer clarity over cleverness.

This project is most valuable when a user can open it, understand what it is doing, and confidently change it to fit their workflow.
