---
phase: planning
title: Project Planning & Task Breakdown
description: Maintenance-oriented planning notes for this repo
---

# Project Planning & Task Breakdown

## Maintenance Milestones

- Understand the repo layout and current override strategy.
- Make one small, high-value change at a time.
- Verify with check, test, build, and diagnostics.
- Stop when only low-value churn remains.

## Task Breakdown

### Phase 1: Inspect

- Review `src/`, `scripts/`, and top-level docs.
- Confirm generated files are treated as generated.

### Phase 2: Improve

- Fix correctness or clarity issues with minimal diffs.
- Keep changes aligned with the file-based customization model.

### Phase 3: Verify

- Run typecheck, tests, build, and diagnostics on changed files.
- Check that docs match the runtime behavior.

## Dependencies

- Upstream OpenCode prompt changes depend on `bun run snapshots:update`.
- Build and test expectations depend on the Bun toolchain.

## Risks & Mitigation

- Risk: broad rewrites add complexity. Mitigation: keep patches small.
- Risk: docs drift from runtime behavior. Mitigation: update docs in the same change.
- Risk: generated assets get edited by hand. Mitigation: regenerate them instead.
