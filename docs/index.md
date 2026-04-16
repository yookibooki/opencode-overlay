---
layout: home
title: opencode-overlay
description: File-based OpenCode overrides for prompts, agents, and tools.
hero:
  name: opencode-overlay
  text: OpenCode overlay.
  tagline: Edit `.txt` files.
  actions:
    - theme: brand
      text: Quick Start
      link: /quick-start
    - theme: alt
      text: Reference
      link: /reference
features:
  - icon: ⚡
    title: File-based
    details: Plain `.txt` files.
  - icon: 🔎
    title: Search
    details: Local search.
---

## At a glance

```bash
bun install
bun run build
bun run docs:dev
```

## What you customize

- `src/model.txt`
- `src/agent/*.txt`
- `src/tool/*.txt`
