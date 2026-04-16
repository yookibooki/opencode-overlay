---
title: Quick Start
description: Install and customize OpenCode overlay.
---

# Quick Start
OpenCode plugin for customizing system prompts and tool definitions.

## Setup

### Option 1: use my default prompts

```bash
opencode plugin opencode-overlay --global
```

### Option 2: customize

Step 1: clone this repo:

```bash
git clone --depth 1 https://github.com/yookibooki/opencode-overlay && cd opencode-overlay
```

Step 2: edit `.txt` files

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

Step 3: install:
```bash
bun install && bun run build && opencode plugin "$(pwd)" --global
```
