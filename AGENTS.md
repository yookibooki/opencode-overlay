OpenCode-Overlay customizes OpenCode system prompts and tool definitions.

Rules:
- Keep all overlays text file–based
- Do not break OpenCode behavior
- Do not modify any `.txt` files

Reference:
OpenCode source: /home/dev/gitops/opencode/packages/opencode/src/

For every user-facing fix:

1. bump version with `bun version patch`
2. push tags with `git push --follow-tags`
3. publish with `bun publish`

GitHub updates and releases do not update npm; only `bun publish` does.
