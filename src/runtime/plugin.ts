import path from "path"

import { createRuntimePaths, type RuntimePaths } from "./paths"
import { loadPromptPairs } from "./prompt-overrides"
import { readText } from "./fs"
import { loadToolOverrides } from "./tool-overrides"
import {
  replaceIntroBeforeMarker,
  rewriteMessagePartsInPlace,
  rewriteStringsInPlace,
  sortByLengthDesc,
} from "./text"
import type {
  ChatMessagesOutput,
  ChatSystemOutput,
  PluginDefinition,
  PluginHooks,
  PluginConfig,
  ServerInput,
  SessionCompactingOutput,
  ToolDefinitionInput,
  ToolDefinitionOutput,
} from "./types"

const noSkillsMarker = "No skills are currently available."
const skillSystemMarkers = ["<available_skills>", noSkillsMarker]
const skillToolMarkers = ["## Available Skills", noSkillsMarker]
const skillFolderNames = ["skills", "skill"] as const

function listSkillPaths(input?: ServerInput) {
  const paths = new Set<string>()

  for (const base of [input?.directory, input?.worktree]) {
    if (base === undefined) continue

    for (const name of skillFolderNames) {
      paths.add(path.join(base, name))
    }
  }

  return [...paths]
}

export function extendSkillPaths(config: PluginConfig, input?: ServerInput) {
  const skillPaths = listSkillPaths(input)
  if (skillPaths.length === 0) return

  const next = new Set([...(config.skills?.paths ?? []), ...skillPaths])
  config.skills = {
    ...(config.skills ?? {}),
    paths: [...next],
  }
}

function rewriteSkillIntro(output: ChatSystemOutput, override: string, markers: string[]) {
  for (let index = 0; index < output.system.length; index++) {
    const next = replaceIntroBeforeMarker(output.system[index], override, markers)
    if (next !== undefined) output.system[index] = next
  }
}

async function loadPromptOverridePairs(paths: RuntimePaths) {
  const systemOverride = await readText(paths.system)

  const [
    namedSystemPairs,
    genericSystemPairs,
    agentPairs,
    sessionPairs,
    compactionPrompt,
    toolOverrides,
    skillsOverride,
  ] = await Promise.all([
    loadPromptPairs(paths.snapshots.system, (name) => readText(path.join(paths.root, `${name}.txt`)), 1),
    loadPromptPairs(paths.snapshots.system, () => systemOverride, 0),
    loadPromptPairs(paths.snapshots.agent, (name) => readText(path.join(paths.overrides.agent, `${name}.txt`))),
    loadPromptPairs(paths.snapshots.session, (name) => readText(path.join(paths.root, `${name}.txt`))),
    readText(paths.compaction),
    loadToolOverrides(paths.overrides.tool),
    readText(paths.skills),
  ])

  return {
    chatPairs: sortByLengthDesc([...agentPairs, ...namedSystemPairs, ...genericSystemPairs]),
    sessionPairs,
    compactionPrompt,
    toolOverrides,
    skillsOverride,
  }
}

function createHooks(input?: ServerInput, loaded?: Awaited<ReturnType<typeof loadPromptOverridePairs>>): PluginHooks {
  if (loaded === undefined) {
    throw new Error("plugin assets were not loaded")
  }

  return {
    config: async (cfg: PluginConfig) => {
      extendSkillPaths(cfg, input)
    },
    "experimental.chat.system.transform": async (_input: unknown, output: ChatSystemOutput) => {
      rewriteStringsInPlace(output.system, loaded.chatPairs)

      if (loaded.skillsOverride !== undefined) {
        rewriteSkillIntro(output, loaded.skillsOverride, skillSystemMarkers)
      }
    },
    "experimental.chat.messages.transform": async (_input: unknown, output: ChatMessagesOutput) => {
      rewriteMessagePartsInPlace(output.messages, loaded.sessionPairs)
    },
    "experimental.session.compacting": async (_input: unknown, output: SessionCompactingOutput) => {
      if (loaded.compactionPrompt !== undefined) output.prompt = loaded.compactionPrompt
    },
    "tool.definition": async ({ toolID }: ToolDefinitionInput, output: ToolDefinitionOutput) => {
      const override = loaded.toolOverrides.get(toolID)
      if (override === undefined) return

      if (override.parameters !== undefined) output.parameters = override.parameters

      const description = override.description
      if (description === undefined) return

      if (toolID === "skill") {
        const next = replaceIntroBeforeMarker(output.description, description, skillToolMarkers)
        output.description = next ?? description
        return
      }

      output.description = description
    },
  }
}

export function createPlugin(root: string): PluginDefinition {
  const paths = createRuntimePaths(root)
  const loaded = loadPromptOverridePairs(paths)

  return {
    id: "opencode-overlay",
    server: async (input?: ServerInput) => {
      return createHooks(input, await loaded)
    },
  }
}
