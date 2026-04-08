import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

type PromptPair = {
  builtin: string
  override: string
}

type DirEntryLike = {
  name: string
  isFile(): boolean
}

type ServerInput = {
  directory?: string
  worktree?: string
}

async function readText(filePath: string) {
  return fs.readFile(filePath, "utf8").catch(() => undefined)
}

const root = path.dirname(fileURLToPath(import.meta.url))
const systemPath = path.join(root, "system.txt")
const promptsRoot = path.join(root, "prompts")
const snapshotsRoot = path.join(promptsRoot, "_snapshots")
const snapshotSystemDir = path.join(snapshotsRoot, "system")
const snapshotAgentDir = path.join(snapshotsRoot, "agent")
const snapshotSessionDir = path.join(snapshotsRoot, "session")
const agentOverridesDir = path.join(promptsRoot, "agent")
const sessionOverridesDir = path.join(promptsRoot, "session")
const toolsDir = path.join(root, "tools")

async function listTextNames(dir: string) {
  const entries = (await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) as DirEntryLike[]

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
    .map((entry) => path.basename(entry.name, ".txt"))
    .sort((a, b) => a.localeCompare(b))
}

function sortByLengthDesc(items: PromptPair[]) {
  return [...items].sort((a, b) => b.builtin.length - a.builtin.length)
}

function replaceByPrefix(text: string, pairs: PromptPair[]) {
  for (const pair of pairs) {
    if (text.startsWith(pair.builtin)) return `${pair.override}${text.slice(pair.builtin.length)}`
  }
  return text
}

async function loadPromptPairs(snapshotDir: string, overrideDir: string) {
  const names = await listTextNames(snapshotDir)
  const pairs = await Promise.all(
    names.map(async (name) => {
      const [builtin, override] = await Promise.all([
        readText(path.join(snapshotDir, `${name}.txt`)),
        readText(path.join(overrideDir, `${name}.txt`)),
      ])

      if (builtin === undefined || override === undefined) return undefined
      return { builtin, override }
    }),
  )

  return sortByLengthDesc(pairs.filter((pair): pair is PromptPair => pair !== undefined))
}

async function loadSystemPairs(overrideText: string | undefined) {
  if (overrideText === undefined) return []

  const names = await listTextNames(snapshotSystemDir)
  const builtins = await Promise.all(names.map((name) => readText(path.join(snapshotSystemDir, `${name}.txt`))))
  return sortByLengthDesc(
    builtins
      .filter((text): text is string => text !== undefined)
      .map((builtin) => ({ builtin, override: overrideText })),
  )
}

async function loadDescriptions() {
  const descriptions = new Map<string, string>()
  const entries = await listTextNames(toolsDir)

  await Promise.all(
    entries.map(async (name) => {
      const text = await readText(path.join(toolsDir, `${name}.txt`))
      if (text === undefined) return
      descriptions.set(name, text.trimEnd())
    }),
  )

  return descriptions
}

function customSkillPaths(input?: ServerInput) {
  if (!input?.directory || !input?.worktree) return []

  return [...new Set([
    path.join(input.directory, "skills"),
    path.join(input.directory, "skill"),
    path.join(input.worktree, "skills"),
    path.join(input.worktree, "skill"),
  ])]
}

export default {
  id: "opencode-thrifty",
  server: async (input?: ServerInput) => {
    const systemOverride = await readText(systemPath)
    const [systemPairs, agentPairs, sessionPairs, sessionCompaction, descriptions] = await Promise.all([
      loadSystemPairs(systemOverride),
      loadPromptPairs(snapshotAgentDir, agentOverridesDir),
      loadPromptPairs(snapshotSessionDir, sessionOverridesDir),
      readText(path.join(sessionOverridesDir, "compaction.txt")),
      loadDescriptions(),
    ])
    const promptPairsSorted = sortByLengthDesc([...agentPairs, ...systemPairs])

    return {
      // Extend the built-in skill service with project-root folders.
      config: async (cfg: { skills?: { paths?: string[]; urls?: string[] } }) => {
        const skillPaths = customSkillPaths(input)
        if (!skillPaths.length) return

        const next = new Set([...(cfg.skills?.paths ?? []), ...skillPaths])
        cfg.skills = {
          ...(cfg.skills ?? {}),
          paths: [...next],
        }
      },
      "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {
        for (let index = 0; index < output.system.length; index++) {
          const next = replaceByPrefix(output.system[index], promptPairsSorted)
          if (next !== output.system[index]) output.system[index] = next
        }
      },
      "experimental.chat.messages.transform": async (
        _input: unknown,
        output: { messages: Array<{ parts: Array<{ type: string; text: string }> }> },
      ) => {
        for (const message of output.messages) {
          for (const part of message.parts) {
            if (part.type !== "text") continue
            const next = replaceByPrefix(part.text, sessionPairs)
            if (next !== part.text) part.text = next
          }
        }
      },
      "experimental.session.compacting": async (_input: unknown, output: { prompt?: string }) => {
        if (sessionCompaction === undefined) return
        output.prompt = sessionCompaction
      },
      "tool.definition": async ({ toolID }: { toolID: string }, output: { description: string; parameters: unknown }) => {
        const description = descriptions.get(toolID)
        if (description === undefined) return
        output.description = description
      },
    }
  },
}
