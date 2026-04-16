---
title: Quick Start
description: Install, customize, and publish opencode-overlay.
---

# Quick Start

## 1. Install

```bash
opencode plugin opencode-overlay --global
```

## 2. Customize

Clone the repo and edit the overlay files:

```bash
git clone --depth 1 https://github.com/yookibooki/opencode-overlay
cd opencode-overlay
```

```text
├── agent/
│   ├── compaction.txt
│   ├── explore.txt
│   ├── generate.txt
│   ├── summary.txt
│   └── title.txt
├── model.txt
├── build-switch.txt
├── max-steps.txt
├── plan-reminder-anthropic.txt
├── plan.txt
└── tool/
    ├── apply_patch.txt
    ├── bash.txt
    ├── codesearch.txt
    ├── edit.txt
    ├── glob.txt
    ├── grep.txt
    ├── lsp.txt
    ├── ls.txt
    ├── multiedit.txt
    ├── plan-enter.txt
    ├── plan-exit.txt
    ├── question.txt
    ├── read.txt
    ├── task.txt
    ├── todowrite.txt
    ├── webfetch.txt
    ├── websearch.txt
    └── write.txt
```

## 3. Build

```bash
bun install
bun run build
```

## 4. Publish the docs

The docs site is built with VitePress and deployed to GitHub Pages from `.github/workflows/pages.yml`.

## Notes

- Search is local.
- Theme switching is built in.
- The site is designed to stay simple, fast, and easy to maintain.
