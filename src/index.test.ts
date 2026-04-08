import { expect, test } from "bun:test"
import fs from "fs/promises"
import os from "os"
import path from "path"

import plugin from "./index"

async function withTempDir<T>(fn: (root: string) => Promise<T>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-thrifty-"))

  try {
    return await fn(root)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
}

test("server exposes file-based overrides and skill path injection", async () => {
  await withTempDir(async (root) => {
    const directory = path.join(root, "directory")
    const worktree = path.join(root, "worktree")
    await fs.mkdir(directory, { recursive: true })
    await fs.mkdir(worktree, { recursive: true })

    const hooks = await plugin.server({ directory, worktree } as never)
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

    const output = { description: "placeholder", parameters: {} }
    await hooks["tool.definition"]({ toolID: "bash" }, output as never)

    expect(output.description).not.toBe("placeholder")

    const planEnter = { description: "placeholder", parameters: {} }
    await hooks["tool.definition"]({ toolID: "plan_enter" }, planEnter as never)

    expect(planEnter.description).toContain("planning mode")

    const compaction = {} as { prompt?: string }
    await hooks["experimental.session.compacting"]({}, compaction as never)

    const expectedCompaction = await fs.readFile(
      path.join(process.cwd(), "src", "prompts", "session", "compaction.txt"),
      "utf8",
    )

    expect(compaction.prompt).toBe(expectedCompaction)
  })
})

test("prompt transforms use the paired snapshot text", async () => {
  await withTempDir(async (root) => {
    const hooks = await plugin.server({ directory: root, worktree: root } as never)

    const agentSnapshot = await fs.readFile(
      path.join(process.cwd(), "src", "prompts", "_snapshots", "agent", "explore.txt"),
      "utf8",
    )
    const agentOverride = await fs.readFile(path.join(process.cwd(), "src", "prompts", "agent", "explore.txt"), "utf8")
    const systemOutput = { system: [agentSnapshot] }

    await hooks["experimental.chat.system.transform"]({}, systemOutput as never)

    expect(systemOutput.system[0]).toBe(agentOverride)

    const sessionSnapshot = await fs.readFile(
      path.join(process.cwd(), "src", "prompts", "_snapshots", "session", "build-switch.txt"),
      "utf8",
    )
    const sessionOverride = await fs.readFile(path.join(process.cwd(), "src", "prompts", "session", "build-switch.txt"), "utf8")
    const messages = { messages: [{ parts: [{ type: "text", text: sessionSnapshot }] }] }

    await hooks["experimental.chat.messages.transform"]({}, messages as never)

    expect(messages.messages[0].parts[0].text).toBe(sessionOverride)
  })
})
