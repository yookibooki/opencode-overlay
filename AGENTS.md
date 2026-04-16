OpenCode-Overlay is a plugin for customizing OpenCode system prompts and tool definitions.

Project tree view:
```text
src/
├── agent
│   ├── compaction.txt
│   ├── explore.txt
│   ├── generate.txt
│   ├── summary.txt
│   └── title.txt
├── model.txt
├── build-switch.txt
├── index.ts
├── max-steps.txt
├── plan-reminder-anthropic.txt
├── plan.txt
└── tool
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

Supporting code: `src/overlay-helpers.ts`, `scripts/build-helpers.ts`, and `test/`.

Consolidate the model-specific prompt files:
- anthropic.txt
- copilot-gpt-5.txt
- gemini.txt
- kimi.txt
- trinity.txt
- beast.txt
- codex.txt
- default.txt
- gpt.txt

Replace them with a single file:
- model.txt

Reference:
`/home/dev/gitops/opencode/packages/opencode/src/session/prompt/`

For the following prompt files:
- build-switch.txt
- plan-reminder-anthropic.txt
- max-steps.txt
- plan.txt

Replace each one with a `.txt` file of the same name.

Reference:
`/home/dev/gitops/opencode/packages/opencode/src/session/prompt/`

Tool definition files involved:
- apply_patch.txt
- bash.txt
- codesearch.txt
- edit.txt
- glob.txt
- grep.txt
- lsp.txt
- ls.txt
- multiedit.txt
- plan-enter.txt
- plan-exit.txt
- question.txt
- read.txt
- task.txt
- todowrite.txt
- webfetch.txt
- websearch.txt
- write.txt

Reference:
`/home/dev/gitops/opencode/packages/opencode/src/tool/`

Rules:
- Keep the overlay text file-based.
- Do not break OpenCode behavior.
- Do not touch any `.txt` file
