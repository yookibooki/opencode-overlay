---
phase: testing
title: Testing Strategy
description: Project-specific testing approach and verification checklist
---

# Testing Strategy

## Coverage Goals

- Cover every changed runtime path with a focused test.
- Keep the suite fast enough to run on every maintenance pass.
- Prefer direct file-based fixtures over heavy mocking when practical.

## Unit Tests

### Core plugin behavior

- `src/index.test.ts`: config hook, prompt rewrites, compaction prompt, tool overrides, build copy verification.
- `src/index.read-errors.test.ts`: missing-file and real-error handling for optional reads and directory scans.
- `src/prompts-manifest.test.ts`: generated snapshot manifest stays aligned with the tracked overrides.

## Integration Tests

- Run `bun run build` and confirm copied assets match `src/`.
- Run `bun run test` after touching prompt or tool assets.
- Re-run `bun run snapshots:update` when upstream snapshots change.

## Manual Verification

- `bun run check`
- `bun run test`
- `bun run build`

## Notes

- Keep new tests small and deterministic.
- Favor the real filesystem and temp directories for plugin-path behavior.
- Mock only when the behavior under test is otherwise awkward to isolate.
