---
title: Quick Start
description: Install and customize OpenCode overlay.
---

# Quick Start

```bash
opencode plugin opencode-overlay --global
```

## Customize

Clone the repo:

```bash
git clone --depth 1 https://github.com/yookibooki/opencode-overlay
cd opencode-overlay
```

Edit the `.txt` files.

```bash
bun install && bun run build && opencode plugin "$(pwd)" --global
```
