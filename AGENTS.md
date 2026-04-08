# OpenCode-Thrifty Maintainers Guide

## What this project is
OpenCode-Thrifty is a context-editing plugin for the OpenCode AI coding agent.
The goal is simple: make OpenCode easier to control. By default, OpenCode can send far more context than many users actually want, even for small requests. This plugin exists for people who want a leaner prompt, lower token usage, and clearer control over what gets sent to the model.

## What we are trying to preserve
Please keep this project small, practical, and easy to understand.
A good change should make the plugin easier to use, easier to customize, or easier to trust. It should not add complexity unless that complexity clearly earns its place.

This project is uses Bun + TypeScript. Preferrably, no npm and yarn, keep the package version in the `0.0.x` range. In general, treat `src/` as the main customization layer. That is the part of the project users should be able to read, understand, and modify without fighting the rest of the architecture. When adding behavior, prefer putting it in `src/` rather than spreading logic into generated or upstream-controlled areas.

`src/prompts/_snapshots/`, `src/prompts.manifest.json`, and `dist/` are generated files and usually should not be edited by hand. To refresh prompt snapshots, run `bun run snapshots:update`. `AGENTS.md` is intentionally maintained for AI coding agent instructions.

## Override files
Keep overrides visible and user-editable as much as possible.

When OpenCode exposes a context surface that can reasonably be customized, it is usually better to expose that as an override file rather than bury it behind internal logic. The project should feel approachable to users who want to tailor behavior for themselves.

The primary install flow must work out of the box: `opencode plugin opencode-thrifty --global` should give users a working, minimal plugin with no extra steps. Or add `"plugin": ["opencode-thrifty"]` to `~/.config/opencode/opencode.json`, same result. Note: `opencode-thrifty` is a npm package.
For deeper customization, clone the repository into a practical local workspace and edit the `.txt` files directly, for example: `git clone --depth 1 https://github.com/yookibooki/opencode-thrifty "$HOME/"`

This project meant support two kinds of users equally well:
1. Someone who installs the package and wants a minimal plugin that works immediately.
2. Someone who clones the repo and wants full control over the context layer through `src/`.
Both experiences should feel straightforward.

> Useful information about the plugin. These details may be wrong and should not be treated as strict rules.
```
### File map
- `src/index.ts` is the main plugin entry.
- `src/system.txt` is the global system override.
- `src/prompts.manifest.json` tracks mirrored prompt ids, including dormant upstream entries.
- `src/prompts/_snapshots/**` stores upstream copies for exact matching.
- `src/prompts/agent/*.txt` and `src/prompts/session/*.txt` are visible overrides.
- `src/tools/*.txt` are description-only overrides.
- `scripts/update-snapshots.ts` refreshes the snapshot tree.
### Runtime model
- OpenCode loads `dist/index.js`.
- Build copies prompt and tool assets into `dist/`.
- Hooks: `config`, `experimental.chat.system.transform`, `experimental.chat.messages.transform`, `experimental.session.compacting`, and `tool.definition`.
- `package.json` exports `dist/index.js`.
- `bun run build` compiles JS and declarations, then copies runtime assets.
- `scripts/update-snapshots.ts` refreshes the snapshot tree from `anomalyco/opencode@dev`.
```

## Reference material
These are useful for understanding upstream behavior, but they are reference-only:
- OpenCode's source code in `/home/dev/gitops/opencode` (or https://github.com/anomalyco/opencode)
- Plugins documentation in `/home/dev/gitops/opencode/packages/web/src/content/docs/plugins.mdx` (or https://opencode.ai/docs/plugins/)
- `@oh-my-opencode-slim/` — a similar OpenCode plugin that is useful as a reference. 
Read from them. Learn from them. Do not edit them.

Treat @oh-my-opencode-slim/ as recommended plugin design, try to copy from it when possible.
Make sure opencode-thrifty adapts best practices from @oh-my-opencode-slim:
```
### Build Artifacts
- `dist/index.js` - Main plugin bundle (ESM)
- `dist/index.d.ts` - TypeScript declarations
### Published Files
- `dist/` - Built JavaScript and declarations
- `README.md` - Documentation
```

## Final note for maintainers
When in doubt, prefer clarity over cleverness.
This project is most valuable when a user can open it up, understand what it is doing, and confidently change it to fit their workflow.
