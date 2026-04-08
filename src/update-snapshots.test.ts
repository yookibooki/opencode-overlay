import { expect, test } from "bun:test"

import { buildSnapshotManifest } from "../scripts/update-snapshots"

test("snapshot manifest selection keeps system, session, and agent prompts separate", () => {
  const manifest = buildSnapshotManifest([
    { type: "blob", path: "packages/opencode/src/session/prompt/default.txt" },
    { type: "blob", path: "packages/opencode/src/session/prompt/gpt.txt" },
    { type: "blob", path: "packages/opencode/src/session/prompt/custom-session.txt" },
    { type: "blob", path: "packages/opencode/src/session/prompt/custom-session.txt" },
    { type: "blob", path: "packages/opencode/src/session/prompt/plan.txt" },
    { type: "blob", path: "packages/opencode/src/agent/prompt/explore.txt" },
    { type: "blob", path: "packages/opencode/src/agent/prompt/explore.txt" },
    { type: "blob", path: "packages/opencode/src/agent/generate.txt" },
    { type: "blob", path: "packages/opencode/src/agent/prompt/summary.txt" },
    { type: "tree", path: "packages/opencode/src/agent/prompt" },
  ])

  expect(manifest).toEqual({
    system: ["default", "gpt"],
    session: ["custom-session", "plan"],
    agent: ["explore", "generate", "summary"],
  })
})
