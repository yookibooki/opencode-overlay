# opencode-thrifty

OpenCode plugin for prompt and tool-description overrides.

This package is published as a Bun-native TypeScript package.

## Use

Add this to `opencode.json`:

```json
{
  "plugin": ["opencode-thrifty"]
}
```

Update the upstream snapshots with `bun run snapshots:update`.

## Files

- `src/system.txt` overrides the system prompt.
- `src/tools/*.txt` override built-in tool descriptions.
- `src/tools/*.ts` define special tool overrides like `skill` and `invalid`.
- `src/prompts/session/*.txt` override plan/build reminders and compaction.
- `src/prompts/agent/*.txt` override agent-specific prompts.
- `src/prompts.manifest.json` lists the builtin prompt snapshots.
- `src/prompts/_snapshots/**` stores the upstream snapshots used for exact matching.

Note: the `max-steps` reminder is currently inlined in OpenCode core and is not directly hookable.
