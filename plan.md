# Plan

If I were maintaining this project for the long term, I would keep it boring, explicit, and file-based.

## What I Would Do Next

1. Keep every exposed static prompt surface editable as text in `src/`.
2. Add new `.txt` files only when OpenCode exposes a real new static surface.
3. Keep `src/index.ts` small and direct. Move logic out only when it clearly improves clarity.
4. Preserve OpenCode's dynamic runtime data instead of trying to recreate it in the plugin.
5. Keep `coverage.md` current so users can see exactly what is and is not controlled here.
6. Keep tests focused on behavior boundaries, not implementation details.
7. Refresh snapshots when upstream OpenCode prompt text changes, and nothing more.
8. Keep tool schema overrides in `src/tools/*.json` instead of hidden code paths.

## What I Would Avoid

- rewriting the plugin into a generic context engine
- adding hidden fallback logic for every possible upstream change
- moving user-editable behavior out of text files and into code
- trying to own tool schemas, arguments, or runtime message content from the plugin

## My Opinion

The best version of this project is not the one that does the most. It is the one that gives users the most control over the static context OpenCode exposes, while staying simple enough to inspect and customize in a minute.
