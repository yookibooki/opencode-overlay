import { expect, test } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { copyTxtFiles, findRemoteTxt, readTxtNames, remoteTxtPaths } from "../scripts/build-helpers.ts"

const tempDir = async () => fs.mkdtemp(path.join(os.tmpdir(), "opencode-overlay-"))

test("copyTxtFiles rejects missing source directories", async () => {
  const base = await tempDir()
  const missing = path.join(base, "missing")
  const target = path.join(base, "out")

  await expect(copyTxtFiles(missing, target)).rejects.toThrow()
})

test("readTxtNames rejects missing directories", async () => {
  const base = await tempDir()
  const missing = path.join(base, "missing")

  await expect(readTxtNames(missing)).rejects.toThrow()
})

test("findRemoteTxt prefers the exact path", () => {
  const tree = [
    { type: "blob", path: "packages/opencode/src/session/prompt/alpha.txt" },
    { type: "blob", path: "packages/opencode/src/session/prompt/deep/alpha.txt" },
  ]

  expect(findRemoteTxt(tree, "packages/opencode/src/session/prompt", "alpha")).toBe(
    "packages/opencode/src/session/prompt/alpha.txt",
  )
})

test("findRemoteTxt rejects ambiguous matches without an exact path", () => {
  const tree = [
    { type: "blob", path: "packages/opencode/src/session/prompt/deep/plan.txt" },
    { type: "blob", path: "packages/opencode/src/session/prompt/other/plan.txt" },
  ]

  expect(() => findRemoteTxt(tree, "packages/opencode/src/session/prompt", "plan")).toThrow(/Ambiguous/)
})

test("remoteTxtPaths returns sorted text blobs", () => {
  const tree = [
    { type: "blob", path: "packages/opencode/src/session/prompt/b.txt" },
    { type: "tree", path: "packages/opencode/src/session/prompt/sub" },
    { type: "blob", path: "packages/opencode/src/session/prompt/a.txt" },
  ]

  expect(remoteTxtPaths(tree, "packages/opencode/src/session/prompt")).toEqual([
    "packages/opencode/src/session/prompt/a.txt",
    "packages/opencode/src/session/prompt/b.txt",
  ])
})
