# Maintainer Direction

OpenCode-Thrifty should stay small, file-based, and easy to inspect.

- Preserve the out-of-the-box install flow: `opencode plugin opencode-thrifty --global`
- Prefer `src/` text and schema assets over extra runtime code when adding or changing overrides
- Keep customization visible and user-editable instead of hiding behavior behind internal logic
- Treat `dist/`, `src/prompts/_snapshots/`, and `src/prompts.manifest.json` as generated outputs
- Make changes that improve maintainability without changing runtime behavior unless the behavior change is the point of the patch
