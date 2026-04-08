# Coverage

This plugin trims the static context OpenCode exposes through plugin hooks. It does not and should not try to replace every token the app can ever send.

## Fully Covered

- `src/system.txt`
- `src/prompts/agent/*.txt`
- `src/prompts/session/*.txt`
- `src/prompts/session/compaction.txt`
- `src/prompts/system/skills.txt`
- `src/tools/*.txt`
- `src/tools/*.json`
- `src/tools/skill.txt`
- local `skills/` and `skill/` folders from `directory` and `worktree`

## Partially Covered

- Prompt replacement is prefix-based, so only the opening part of upstream text is replaced.
- The skill system block keeps OpenCode's live skill list and only rewrites the editable preamble.
- The skill tool keeps OpenCode's live skill list and only rewrites the editable preamble.

## Not Covered

- user messages
- assistant messages
- tool call arguments
- tool results
- runtime metadata
- OpenCode internal text that is not exposed through plugin hooks

## Bottom Line

This is near the practical ceiling for a plugin that stays small, file-based, and easy to understand. The remaining gap is mostly dynamic runtime data that should stay owned by OpenCode itself.
