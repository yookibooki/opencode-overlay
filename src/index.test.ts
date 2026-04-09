import { expect, test } from "bun:test"
import { spawnSync } from "child_process"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { toJSONSchema } from "zod"

import plugin, {
  type ChatMessagesOutput,
  type ChatSystemOutput,
  type PluginConfig,
  type SessionCompactingOutput,
  type ToolDefinitionOutput,
} from "./index"

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

    const hooks = await plugin.server({ directory, worktree })
    const config: PluginConfig = {
      skills: {
        paths: [path.join(directory, "skills")],
      },
    }

    await hooks.config?.(config)

    expect(config.skills?.paths).toEqual([
      path.join(directory, "skills"),
      path.join(directory, "skill"),
      path.join(worktree, "skills"),
      path.join(worktree, "skill"),
    ])

    const output: ToolDefinitionOutput = { description: "placeholder", parameters: {} }
    await hooks["tool.definition"]?.({ toolID: "bash" }, output)

    expect(output.description).not.toBe("placeholder")

    const planExit: ToolDefinitionOutput = { description: "placeholder", parameters: {} }
    await hooks["tool.definition"]?.({ toolID: "plan_exit" }, planExit)

    expect(planExit.description).toBe(
      (await fs.readFile(path.join(process.cwd(), "src", "tool", "plan_exit.txt"), "utf8")).trimEnd(),
    )

    const planEnter: ToolDefinitionOutput = { description: "placeholder", parameters: {} }
    await hooks["tool.definition"]?.({ toolID: "plan_enter" }, planEnter)

    expect(planEnter.description).toBe(
      (await fs.readFile(path.join(process.cwd(), "src", "tool", "plan_enter.txt"), "utf8")).trimEnd(),
    )

    const skillToolOverride = (await fs.readFile(path.join(process.cwd(), "src", "tool", "skill.txt"), "utf8")).trimEnd()
    const skillToolParameters = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "src", "tool", "skill.json"), "utf8"),
    )
    const skillToolOutput: ToolDefinitionOutput = {
      description: `old intro\n\n## Available Skills\n- **build**: Build workflows`,
      parameters: {},
    }

    await hooks["tool.definition"]?.({ toolID: "skill" }, skillToolOutput)

    expect(skillToolOutput.description).toBe(`${skillToolOverride}\n\n## Available Skills\n- **build**: Build workflows`)
    expect(skillToolOutput.description.startsWith(skillToolOverride)).toBe(true)
    expect(skillToolOutput.description).not.toContain("No skills are currently available.")

    const { $schema: _schema, ...skillToolJsonSchema } = toJSONSchema(skillToolOutput.parameters as never) as {
      $schema?: string
      [key: string]: unknown
    }

    expect(skillToolJsonSchema).toEqual(skillToolParameters)

    const skillToolCrLfOutput: ToolDefinitionOutput = {
      description: `old intro\r\n\r\n## Available Skills\r\n- **build**: Build workflows`,
      parameters: {},
    }

    await hooks["tool.definition"]?.({ toolID: "skill" }, skillToolCrLfOutput)

    expect(skillToolCrLfOutput.description).toBe(
      `${skillToolOverride}\r\n\r\n## Available Skills\r\n- **build**: Build workflows`,
    )

    const skillToolFallback: ToolDefinitionOutput = {
      description: "intro only",
      parameters: {},
    }

    await hooks["tool.definition"]?.({ toolID: "skill" }, skillToolFallback)

    expect(skillToolFallback.description).toBe(skillToolOverride)

    const compaction: SessionCompactingOutput = {}
    await hooks["experimental.session.compacting"]?.({}, compaction)

    const expectedCompaction = await fs.readFile(
      path.join(process.cwd(), "src", "compaction.txt"),
      "utf8",
    )

    expect(compaction.prompt).toBe(expectedCompaction)
  })
})

test("prompt transforms use the paired snapshot text", async () => {
  await withTempDir(async (root) => {
    const hooks = await plugin.server({ directory: root, worktree: root })

    const systemOverride = await fs.readFile(path.join(process.cwd(), "src", "system.txt"), "utf8")
    const systemSnapshotDir = path.join(process.cwd(), "src", "_snapshots", "system")
    const systemSnapshots = (await fs.readdir(systemSnapshotDir, { withFileTypes: true })).filter(
      (entry) => entry.isFile() && entry.name.endsWith(".txt"),
    )

    for (const entry of systemSnapshots) {
      const systemSnapshot = await fs.readFile(path.join(systemSnapshotDir, entry.name), "utf8")
      const systemOutput: ChatSystemOutput = { system: [systemSnapshot] }

      await hooks["experimental.chat.system.transform"]?.({}, systemOutput)

      expect(systemOutput.system[0]).toBe(systemOverride)
      expect(systemOutput.system[0]).toContain("<identity>")
      expect(systemOutput.system[0]).not.toContain("interactive CLI tool")
    }

    const skillSystemOverride = await fs.readFile(path.join(process.cwd(), "src", "skills.txt"), "utf8")
    const skillSystemOutput: ChatSystemOutput = {
      system: [`old intro\n<available_skills>\n  <skill>\n    <name>build</name>\n  </skill>\n</available_skills>`],
    }

    await hooks["experimental.chat.system.transform"]?.({}, skillSystemOutput)

    expect(skillSystemOutput.system[0]).toBe(`${skillSystemOverride}\n<available_skills>\n  <skill>\n    <name>build</name>\n  </skill>\n</available_skills>`)

    const skillSystemCrLfOutput: ChatSystemOutput = {
      system: [`old intro\r\n<available_skills>\r\n  <skill>\r\n    <name>build</name>\r\n  </skill>\r\n</available_skills>`],
    }

    await hooks["experimental.chat.system.transform"]?.({}, skillSystemCrLfOutput)

    expect(skillSystemCrLfOutput.system[0]).toBe(
      `${skillSystemOverride}\r\n<available_skills>\r\n  <skill>\r\n    <name>build</name>\r\n  </skill>\r\n</available_skills>`,
    )

    const agentSnapshot = await fs.readFile(
      path.join(process.cwd(), "src", "_snapshots", "agent", "explore.txt"),
      "utf8",
    )
    const agentOverride = await fs.readFile(path.join(process.cwd(), "src", "agent", "explore.txt"), "utf8")
    const agentOutput: ChatSystemOutput = { system: [agentSnapshot] }

    await hooks["experimental.chat.system.transform"]?.({}, agentOutput)

    expect(agentOutput.system[0]).toBe(agentOverride)

    const agentSnapshotDir = path.join(process.cwd(), "src", "_snapshots", "agent")
    const agentSnapshotEntries = (await fs.readdir(agentSnapshotDir, { withFileTypes: true })).filter(
      (entry) => entry.isFile() && entry.name.endsWith(".txt"),
    )

    for (const entry of agentSnapshotEntries) {
      const name = path.basename(entry.name, ".txt")
      const snapshot = await fs.readFile(path.join(agentSnapshotDir, entry.name), "utf8")
      const override = await fs.readFile(path.join(process.cwd(), "src", "agent", `${name}.txt`), "utf8")
      const output: ChatSystemOutput = { system: [snapshot] }

      await hooks["experimental.chat.system.transform"]?.({}, output)

      expect(output.system[0]).toBe(override)
    }

    const sessionSnapshot = await fs.readFile(
      path.join(process.cwd(), "src", "_snapshots", "session", "build-switch.txt"),
      "utf8",
    )
    const sessionOverride = await fs.readFile(path.join(process.cwd(), "src", "build-switch.txt"), "utf8")
    const messages: ChatMessagesOutput = { messages: [{ parts: [{ type: "text", text: sessionSnapshot }] }] }

    await hooks["experimental.chat.messages.transform"]?.({}, messages)

    expect(messages.messages[0].parts[0].text).toBe(sessionOverride)

    const sessionSnapshotDir = path.join(process.cwd(), "src", "_snapshots", "session")
    const sessionSnapshotEntries = (await fs.readdir(sessionSnapshotDir, { withFileTypes: true })).filter(
      (entry) => entry.isFile() && entry.name.endsWith(".txt"),
    )
    const sessionSnapshotNames = new Set(sessionSnapshotEntries.map((entry) => path.basename(entry.name, ".txt")))
    const sessionOverrideFiles = (await fs.readdir(path.join(process.cwd(), "src"))).filter(
      (name) => name.endsWith(".txt") && sessionSnapshotNames.has(path.basename(name, ".txt")),
    )

    for (const name of sessionOverrideFiles) {
      const base = path.basename(name, ".txt")
      const snapshot = await fs.readFile(path.join(sessionSnapshotDir, `${base}.txt`), "utf8")
      const override = await fs.readFile(path.join(process.cwd(), "src", name), "utf8")
      const output: ChatMessagesOutput = { messages: [{ parts: [{ type: "text", text: snapshot }] }] }

      await hooks["experimental.chat.messages.transform"]?.({}, output)

      expect(output.messages[0].parts[0].text).toBe(override)
    }
  })
})

test("prompt transforms leave unmatched content untouched", async () => {
  await withTempDir(async (root) => {
    const hooks = await plugin.server({ directory: root, worktree: root })

    const systemOutput: ChatSystemOutput = { system: ["unmatched system prompt"] }
    await hooks["experimental.chat.system.transform"]?.({}, systemOutput)
    expect(systemOutput.system).toEqual(["unmatched system prompt"])

    const messages: ChatMessagesOutput = {
      messages: [
        {
          parts: [
            { type: "text", text: "unmatched session prompt" },
            { type: "tool-call", text: "should stay untouched" },
          ],
        },
      ],
    }

    await hooks["experimental.chat.messages.transform"]?.({}, messages)

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

  const toolFiles = (await fs.readdir(path.join(process.cwd(), "src", "tool"))).filter((name) =>
    name.endsWith(".txt") || name.endsWith(".json"),
  )

  for (const name of toolFiles) {
    const srcFile = await fs.readFile(path.join(process.cwd(), "src", "tool", name), "utf8")
    const distFile = await fs.readFile(path.join(process.cwd(), "dist", "tool", name), "utf8")
    expect(distFile).toBe(srcFile)
  }

  const rootTextFiles = (await fs.readdir(path.join(process.cwd(), "src"))).filter((name) => name.endsWith(".txt"))

  for (const name of rootTextFiles) {
    const srcFile = await fs.readFile(path.join(process.cwd(), "src", name), "utf8")
    const distFile = await fs.readFile(path.join(process.cwd(), "dist", name), "utf8")
    expect(distFile).toBe(srcFile)
  }

  const snapshotDirs = await fs.readdir(path.join(process.cwd(), "src", "_snapshots"), { withFileTypes: true })

  for (const entry of snapshotDirs) {
    if (!entry.isDirectory()) continue

    const srcSnapshotDir = path.join(process.cwd(), "src", "_snapshots", entry.name)
    const distSnapshotDir = path.join(process.cwd(), "dist", "_snapshots", entry.name)
    const snapshotFiles = (await fs.readdir(srcSnapshotDir)).filter((name) => name.endsWith(".txt"))

    for (const name of snapshotFiles) {
      const srcFile = await fs.readFile(path.join(srcSnapshotDir, name), "utf8")
      const distFile = await fs.readFile(path.join(distSnapshotDir, name), "utf8")
      expect(distFile).toBe(srcFile)
    }
  }
}, { timeout: 30000 })
