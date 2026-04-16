---
title: Quick Start
description: Install and customize opencode-overlay.
---

# Quick Start

## 1. Install

```bash
opencode plugin opencode-overlay --global
```

## 2. Customize

Clone the repo:

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

## 4. Publish

The docs site deploys from `.github/workflows/pages.yml`.
