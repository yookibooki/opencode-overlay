import fs from "fs/promises"
import path from "path"
import { fileURLToPath, pathToFileURL } from "url"

type Manifest = {
  system: string[]
  agent: string[]
  session: string[]
}

type PromptPair = {
  builtin: string
  override: string
}

async function readText(filePath: string) {
  return fs.readFile(filePath, "utf8").catch(() => undefined)
}

const root = path.dirname(fileURLToPath(import.meta.url))
const manifestPath = path.join(root, "prompts.manifest.json")
const systemPath = path.join(root, "system.txt")
const promptsRoot = path.join(root, "prompts")
const snapshotsRoot = path.join(promptsRoot, "_snapshots")
const agentOverridesDir = path.join(promptsRoot, "agent")
const sessionOverridesDir = path.join(promptsRoot, "session")
const toolsDir = path.join(root, "tools")

function names(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

async function loadManifest(): Promise<Manifest> {
  const raw = await readText(manifestPath)
  if (raw === undefined) return { system: [], agent: [], session: [] }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof Manifest, unknown>>
    return {
      system: names(parsed.system),
      agent: names(parsed.agent),
      session: names(parsed.session),
    }
  } catch {
    return { system: [], agent: [], session: [] }
  }
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

async function loadPairs(names: string[], snapshotDir: string, overrideDir: string) {
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

async function loadSystemPairs(names: string[], overrideText: string | undefined) {
  if (overrideText === undefined) return []

  const builtins = await Promise.all(names.map((name) => readText(path.join(snapshotsRoot, "system", `${name}.txt`))))
  return sortByLengthDesc(
    builtins
      .filter((text): text is string => text !== undefined)
      .map((builtin) => ({ builtin, override: overrideText })),
  )
}

async function loadDescriptions() {
  const descriptions = new Map<string, string>()
  const entries = await fs.readdir(toolsDir, { withFileTypes: true }).catch(() => [])

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
      .map(async (entry) => {
        const text = await readText(path.join(toolsDir, entry.name))
        if (text === undefined) return
        descriptions.set(path.basename(entry.name, ".txt"), text.trimEnd())
      }),
  )

  return descriptions
}

async function loadTools() {
  const tools: Record<string, unknown> = {}
  const entries = await fs.readdir(toolsDir, { withFileTypes: true }).catch(() => [])

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map(async (entry) => {
        const name = path.basename(entry.name, ".ts")
        const mod = await import(pathToFileURL(path.join(toolsDir, entry.name)).href)
        if (!mod.default) return
        tools[name] = mod.default
      }),
  )

  return tools
}

export default {
  id: "opencode-thrifty",
  server: async () => {
    const manifest = await loadManifest()
    const systemOverride = await readText(systemPath)
    const [systemPairs, agentPairs, sessionPairs, sessionCompaction, descriptions, tools] = await Promise.all([
      loadSystemPairs(manifest.system, systemOverride),
      loadPairs(manifest.agent, path.join(snapshotsRoot, "agent"), agentOverridesDir),
      loadPairs(manifest.session, path.join(snapshotsRoot, "session"), sessionOverridesDir),
      readText(path.join(sessionOverridesDir, "compaction.txt")),
      loadDescriptions(),
      loadTools(),
    ])

    return {
      "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {
        if (systemOverride === undefined) return
        const promptPairs = sortByLengthDesc([...agentPairs, ...systemPairs])

        for (let index = 0; index < output.system.length; index++) {
          const next = replaceByPrefix(output.system[index], promptPairs)
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
      tool: tools,
    }
  },
}
