---
title: API Reference
description: How opencode-overlay rewrites prompts and tool definitions.
---

# API Reference

## What the plugin does

- rewrites selected system prompt text
- rewrites message content by prefix match
- overrides tool descriptions from `tool/*.txt`

## Key files

| File | Purpose |
| --- | --- |
| `src/index.ts` | Registers the plugin hooks |
| `src/overlay-helpers.ts` | Loads and rewrites overlay text |
| `scripts/build.mjs` | Syncs upstream reference text into `dist/_refs` |

## Runtime behavior

### System prompts

Prompt text is rewritten by prefix match, so shorter docs stay flexible while preserving the upstream shape.

### Tool definitions

Tool files are normalized before lookup, so names like `ls.txt` and `list.txt` collide intentionally if they map to the same tool id.

### Build output

The build emits a `dist/` directory containing:

- the compiled plugin
- copied `.txt` overlays
- upstream reference text in `dist/_refs`
