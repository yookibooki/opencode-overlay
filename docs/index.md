---
layout: home
title: opencode-overlay
description: File-based OpenCode prompt and tool overrides.
hero:
  name: opencode-overlay
  text: OpenCode docs, but cleaner.
  tagline: A minimal, file-based way to customize prompts, agents, and tool definitions.
  actions:
    - theme: brand
      text: Quick Start
      link: /quick-start
    - theme: alt
      text: API Reference
      link: /api
features:
  - icon: ⚡
    title: File-based
    details: Keep all overrides in plain .txt files with predictable names.
  - icon: 🌗
    title: Day / night
    details: Built-in appearance switch with a polished docs theme.
  - icon: 🔎
    title: Search
    details: Local search works out of the box on GitHub Pages.
---

## Why this exists

`opencode-overlay` keeps OpenCode customization simple: edit text files, build once, and publish.

<div class="landing-grid">
  <div class="landing-card">
    <h3>Fast to understand</h3>
    <p>Docs map directly to the plugin’s on-disk structure.</p>
  </div>
  <div class="landing-card">
    <h3>Easy to deploy</h3>
    <p>GitHub Pages hosts the docs site; the plugin ships from the repo.</p>
  </div>
  <div class="landing-card">
    <h3>Minimal code</h3>
    <p>Most behavior lives in a small build pipeline and a few helpers.</p>
  </div>
</div>

## At a glance

```bash
bun install
bun run build
bun run docs:dev
```

## What you customize

- `src/model.txt` for model-specific system guidance
- `src/agent/*.txt` for agent prompts
- `src/tool/*.txt` for tool descriptions
- `docs/` for this website
