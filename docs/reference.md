---
title: Reference
description: Prompt and tool overrides.
---

# Reference

## Key files

| File | Purpose |
| --- | --- |
| `src/index.ts` | Registers the plugin hooks |
| `src/overlay-helpers.ts` | Loads overlay text |
| `scripts/build.mjs` | Syncs upstream reference text into `dist/_refs` |

## Behavior

- prompt text is matched by prefix
- tool files are normalized before lookup

## Build output

- the compiled plugin
- copied `.txt` overlays
- upstream reference text in `dist/_refs`
