import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

type PrefixPair = {
  builtin: string
  override: string
}

type ToolOverride = {
  description?: string
  parameters?: Record<string, unknown>
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

async function readJsonObject(filePath: string) {
  const text = await readText(filePath)
  if (text === undefined) return undefined

  try {
    const value = JSON.parse(text) as unknown
    if (!isPlainObject(value)) {
      throw new Error("expected a JSON object")
    }
    return value
  } catch (error) {
    throw new Error(`Invalid JSON object in ${filePath}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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
const systemOverridesDir = path.join(promptsRoot, "system")
const toolsDir = path.join(root, "tools")
const noSkillsMarker = "No skills are currently available."

const skillSystemMarkers = ["<available_skills>", noSkillsMarker]
const skillToolMarkers = ["## Available Skills", noSkillsMarker]

async function listFileBaseNames(dir: string, extensions: string[]) {
  const entries = (await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) as DirEntryLike[]
  const names = new Set<string>()

  for (const entry of entries) {
    if (!entry.isFile()) continue

    for (const extension of extensions) {
      if (entry.name.endsWith(extension)) {
        names.add(path.basename(entry.name, extension))
        break
      }
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b))
}

function sortByLengthDesc(items: PrefixPair[]) {
  return [...items].sort((a, b) => b.builtin.length - a.builtin.length)
}

function replaceByPrefix(text: string, pairs: PrefixPair[]) {
  for (const pair of pairs) {
    if (text.startsWith(pair.builtin)) return `${pair.override}${text.slice(pair.builtin.length)}`
  }
  return text
}

function replaceIntroBeforeMarker(text: string, override: string, markers: string[]): string | undefined {
  for (const marker of markers) {
    const index = text.indexOf(marker)
    if (index !== -1) {
      let start = index
      while (start > 0 && (text[start - 1] === "\n" || text[start - 1] === "\r")) start--
      return `${override}${text.slice(start)}`
    }
  }
  return undefined
}

function rewriteStringsInPlace(strings: string[], pairs: PrefixPair[]) {
  for (let index = 0; index < strings.length; index++) {
    const next = replaceByPrefix(strings[index], pairs)
    if (next !== strings[index]) strings[index] = next
  }
}

function rewriteMessagePartsInPlace(
  messages: Array<{ parts: Array<{ type: string; text: string }> }>,
  pairs: PrefixPair[],
) {
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== "text") continue
      const next = replaceByPrefix(part.text, pairs)
      if (next !== part.text) part.text = next
    }
  }
}

async function loadNamedPromptPairs(snapshotDir: string, overrideDir: string) {
  const names = await listFileBaseNames(snapshotDir, [".txt"])
  const pairs = await Promise.all(
    names.map(async (name) => {
      const builtin = await readText(path.join(snapshotDir, `${name}.txt`))
      if (builtin === undefined) return undefined

      const override = await readText(path.join(overrideDir, `${name}.txt`))
      if (override === undefined) return undefined
      return { builtin, override }
    }),
  )

  return sortByLengthDesc(pairs.filter((pair): pair is PrefixPair => pair !== undefined))
}

async function loadSharedPromptPairs(snapshotDir: string, sharedOverride: string | undefined) {
  if (sharedOverride === undefined) return []

  const names = await listFileBaseNames(snapshotDir, [".txt"])
  const builtins = await Promise.all(names.map((name) => readText(path.join(snapshotDir, `${name}.txt`))))
  return sortByLengthDesc(
    builtins
      .filter((text): text is string => text !== undefined)
      .map((builtin) => ({ builtin, override: sharedOverride })),
  )
}

async function loadToolOverrides() {
  const overrides = new Map<string, ToolOverride>()
  const entries = await listFileBaseNames(toolsDir, [".txt", ".json"])

  await Promise.all(
    entries.map(async (name) => {
      const [description, schema] = await Promise.all([
        readText(path.join(toolsDir, `${name}.txt`)),
        readJsonObject(path.join(toolsDir, `${name}.json`)),
      ])

      if (description === undefined && schema === undefined) return
      overrides.set(name, {
        ...(description !== undefined ? { description: description.trimEnd() } : {}),
        ...(schema !== undefined ? { parameters: schema } : {}),
      })
    }),
  )

  return overrides
}

function customSkillPaths(input?: ServerInput) {
  const paths: string[] = []

  if (input?.directory) {
    paths.push(path.join(input.directory, "skills"), path.join(input.directory, "skill"))
  }

  if (input?.worktree) {
    paths.push(path.join(input.worktree, "skills"), path.join(input.worktree, "skill"))
  }

  return [...new Set(paths)]
}

export default {
  id: "opencode-thrifty",
  server: async (input?: ServerInput) => {
    const systemOverride = await readText(systemPath)
    const [
      systemPrefixPairs,
      agentPrefixPairs,
      sessionPrefixPairs,
      sessionCompactionPrompt,
      toolOverrides,
      skillSystemOverride,
    ] = await Promise.all([
      loadSharedPromptPairs(snapshotSystemDir, systemOverride),
      loadNamedPromptPairs(snapshotAgentDir, agentOverridesDir),
      loadNamedPromptPairs(snapshotSessionDir, sessionOverridesDir),
      readText(path.join(sessionOverridesDir, "compaction.txt")),
      loadToolOverrides(),
      readText(path.join(systemOverridesDir, "skills.txt")),
    ])
    const chatPrefixPairs = sortByLengthDesc([...agentPrefixPairs, ...systemPrefixPairs])

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
        rewriteStringsInPlace(output.system, chatPrefixPairs)
        if (skillSystemOverride !== undefined) {
          // Keep the live skill list, but let users own the static preamble.
          for (let index = 0; index < output.system.length; index++) {
            const next = replaceIntroBeforeMarker(output.system[index], skillSystemOverride, skillSystemMarkers)
            if (next !== undefined) output.system[index] = next
          }
        }
      },
      "experimental.chat.messages.transform": async (
        _input: unknown,
        output: { messages: Array<{ parts: Array<{ type: string; text: string }> }> },
      ) => {
        rewriteMessagePartsInPlace(output.messages, sessionPrefixPairs)
      },
      "experimental.session.compacting": async (_input: unknown, output: { prompt?: string }) => {
        if (sessionCompactionPrompt === undefined) return
        output.prompt = sessionCompactionPrompt
      },
      "tool.definition": async ({ toolID }: { toolID: string }, output: { description: string; parameters: unknown }) => {
        const override = toolOverrides.get(toolID)
        if (override === undefined) return

        if (override.parameters !== undefined) output.parameters = override.parameters

        const description = override.description
        if (description === undefined) return

        if (toolID === "skill") {
          // Same idea as the system block: replace only the fixed intro text.
          const next = replaceIntroBeforeMarker(output.description, description, skillToolMarkers)
          output.description = next ?? description
          return
        }

        output.description = description
      },
    }
  },
}
