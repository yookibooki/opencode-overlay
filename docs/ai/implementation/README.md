---
phase: implementation
title: Implementation Guide
description: Project-specific implementation notes and code guidelines
---

# Implementation Guide

## Development Setup

- Install dependencies with Bun.
- Use `bun run check` for typechecking, `bun run test` for the suite, and `bun run build` before shipping.
- Run `bun run snapshots:update` only when upstream OpenCode prompt text changes.

## Code Structure

- `src/index.ts` is the plugin entry and hook wiring.
- `src/system.txt`, `src/prompts/**`, and `src/tools/**` are the user-editable override assets.
- `src/prompts/_snapshots/**` and `src/prompts.manifest.json` are generated reference data.
- `scripts/build.mjs`, `scripts/test.mjs`, and `scripts/update-snapshots.ts` keep the repo reproducible.

## Implementation Notes

### Core Patterns

- Prefer file-based overrides over new runtime logic.
- Keep prompt replacement prefix-based so upstream tails stay intact.
- Preserve OpenCode's live skill list; only rewrite static preambles.
- Treat missing optional files and directories as ignorable, but fail fast on real filesystem errors.

### Integration Points

- `config` adds local `skills/` and `skill/` folders from the current directory or worktree.
- `experimental.chat.system.transform` rewrites system prompts.
- `experimental.chat.messages.transform` rewrites text parts in chat messages.
- `experimental.session.compacting` supplies the compaction prompt.
- `tool.definition` rewrites tool descriptions and schemas.

## Error Handling

- Ignore `ENOENT` for optional override files and directories only.
- Surface JSON parse and permission errors instead of swallowing them.
- Keep generated asset reads simple and predictable.

## Performance Considerations

- Load from disk once at plugin startup; avoid extra runtime state.
- Keep the build copy step straightforward so assets stay in sync.
- Avoid adding network work outside the snapshot refresh script.

## Security Notes

- Do not store secrets in `src/` override files.
- Keep GitHub snapshot fetching isolated to `scripts/update-snapshots.ts`.
- Avoid destructive git or shell behavior in repo scripts.
