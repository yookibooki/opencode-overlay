# OpenCode-Thrifty

Customize OpenCode's default context layer by editing plain text files.

## Setup

**1. Clone the repo** to a stable location:

```sh
INSTALL_DIR="/path/you-will-keep/opencode-thrifty"
git clone --depth 1 https://github.com/yookibooki/opencode-thrifty "$INSTALL_DIR"
cd "$INSTALL_DIR"
bun install
```

**2. Edit** the `.txt` files in `src/` to your liking.

**3. Build and register the plugin:**

```sh
bun run build
opencode plugin "$INSTALL_DIR" --global
```

**4. Restart OpenCode if it's running.**
