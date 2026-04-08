import { expect, test } from "bun:test"
import fs from "fs/promises"
import os from "os"
import path from "path"

import plugin from "./index"

async function withTempDir<T>(fn: (root: string) => Promise<T>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-thrifty-skill-"))
  try {
    return await fn(root)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
}

test("config hook adds extra skill roots without duplicates", async () => {
  await withTempDir(async (root) => {
    const worktree = path.join(root, "worktree")
    const directory = path.join(root, "directory")

    await fs.mkdir(directory, { recursive: true })
    await fs.mkdir(worktree, { recursive: true })

    const hooks = await plugin.server({ worktree, directory } as never)
    const config = {
      skills: {
        paths: [path.join(directory, "skills")],
      },
    }

    await hooks.config?.(config as never)

    expect(config.skills?.paths).toEqual([
      path.join(directory, "skills"),
      path.join(directory, "skill"),
      path.join(worktree, "skills"),
      path.join(worktree, "skill"),
    ])
  })
})
