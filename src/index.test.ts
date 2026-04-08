import { expect, test } from "bun:test"
import { spawnSync } from "child_process"
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

    const planExit = { description: "placeholder", parameters: {} }
    await hooks["tool.definition"]({ toolID: "plan_exit" }, planExit as never)

    expect(planExit.description).toBe(
      (await fs.readFile(path.join(process.cwd(), "src", "tools", "plan_exit.txt"), "utf8")).trimEnd(),
    )

    const skillToolOverride = (await fs.readFile(path.join(process.cwd(), "src", "tools", "skill.txt"), "utf8")).trimEnd()
    const skillToolParameters = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "src", "tools", "skill.json"), "utf8"),
    )
    const skillToolOutput = {
      description: `old intro\n\n## Available Skills\n- **build**: Build workflows`,
      parameters: {},
    }

    await hooks["tool.definition"]({ toolID: "skill" }, skillToolOutput as never)

    expect(skillToolOutput.description).toBe(`${skillToolOverride}\n\n## Available Skills\n- **build**: Build workflows`)
    expect(skillToolOutput.parameters).toEqual(skillToolParameters)

    const skillToolCrLfOutput = {
      description: `old intro\r\n\r\n## Available Skills\r\n- **build**: Build workflows`,
      parameters: {},
    }

    await hooks["tool.definition"]({ toolID: "skill" }, skillToolCrLfOutput as never)

    expect(skillToolCrLfOutput.description).toBe(
      `${skillToolOverride}\r\n\r\n## Available Skills\r\n- **build**: Build workflows`,
    )

    const skillToolFallback = {
      description: "intro only",
      parameters: {},
    }

    await hooks["tool.definition"]({ toolID: "skill" }, skillToolFallback as never)

    expect(skillToolFallback.description).toBe(skillToolOverride)

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

    const systemSnapshot = await fs.readFile(
      path.join(process.cwd(), "src", "prompts", "_snapshots", "system", "default.txt"),
      "utf8",
    )
    const systemOverride = await fs.readFile(path.join(process.cwd(), "src", "system.txt"), "utf8")
    const systemOutput = { system: [systemSnapshot] }

    await hooks["experimental.chat.system.transform"]({}, systemOutput as never)

    expect(systemOutput.system[0]).toBe(systemOverride)

    const skillSystemOverride = await fs.readFile(path.join(process.cwd(), "src", "prompts", "system", "skills.txt"), "utf8")
    const skillSystemOutput = {
      system: [`old intro\n<available_skills>\n  <skill>\n    <name>build</name>\n  </skill>\n</available_skills>`],
    }

    await hooks["experimental.chat.system.transform"]({}, skillSystemOutput as never)

    expect(skillSystemOutput.system[0]).toBe(`${skillSystemOverride}\n<available_skills>\n  <skill>\n    <name>build</name>\n  </skill>\n</available_skills>`)

    const skillSystemCrLfOutput = {
      system: [`old intro\r\n<available_skills>\r\n  <skill>\r\n    <name>build</name>\r\n  </skill>\r\n</available_skills>`],
    }

    await hooks["experimental.chat.system.transform"]({}, skillSystemCrLfOutput as never)

    expect(skillSystemCrLfOutput.system[0]).toBe(
      `${skillSystemOverride}\r\n<available_skills>\r\n  <skill>\r\n    <name>build</name>\r\n  </skill>\r\n</available_skills>`,
    )

    const agentSnapshot = await fs.readFile(
      path.join(process.cwd(), "src", "prompts", "_snapshots", "agent", "explore.txt"),
      "utf8",
    )
    const agentOverride = await fs.readFile(path.join(process.cwd(), "src", "prompts", "agent", "explore.txt"), "utf8")
    const agentOutput = { system: [agentSnapshot] }

    await hooks["experimental.chat.system.transform"]({}, agentOutput as never)

    expect(agentOutput.system[0]).toBe(agentOverride)

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

test("prompt transforms leave unmatched content untouched", async () => {
  await withTempDir(async (root) => {
    const hooks = await plugin.server({ directory: root, worktree: root } as never)

    const systemOutput = { system: ["unmatched system prompt"] }
    await hooks["experimental.chat.system.transform"]({}, systemOutput as never)
    expect(systemOutput.system).toEqual(["unmatched system prompt"])

    const messages = {
      messages: [
        {
          parts: [
            { type: "text", text: "unmatched session prompt" },
            { type: "tool-call", text: "should stay untouched" },
          ],
        },
      ],
    }

    await hooks["experimental.chat.messages.transform"]({}, messages as never)

    expect(messages.messages[0].parts).toEqual([
      { type: "text", text: "unmatched session prompt" },
      { type: "tool-call", text: "should stay untouched" },
    ])
  })
})

test("build copies prompt and tool override files", async () => {
  const result = spawnSync("bun", ["run", "build"], {
    cwd: process.cwd(),
    encoding: "utf8",
  })

  expect(result.status).toBe(0)

  const toolFiles = (await fs.readdir(path.join(process.cwd(), "src", "tools"))).filter((name) =>
    name.endsWith(".txt") || name.endsWith(".json"),
  )

  for (const name of toolFiles) {
    const srcFile = await fs.readFile(path.join(process.cwd(), "src", "tools", name), "utf8")
    const distFile = await fs.readFile(path.join(process.cwd(), "dist", "tools", name), "utf8")
    expect(distFile).toBe(srcFile)
  }

  const srcSkills = await fs.readFile(path.join(process.cwd(), "src", "prompts", "system", "skills.txt"), "utf8")
  const distSkills = await fs.readFile(path.join(process.cwd(), "dist", "prompts", "system", "skills.txt"), "utf8")
  expect(distSkills).toBe(srcSkills)
}, { timeout: 15000 })
