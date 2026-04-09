import path from "path"

import { fromJSONSchema } from "zod"

import { listFileBaseNames, readJsonObject, readText } from "./fs"

export type ToolOverride = {
  description?: string
  parameters?: unknown
}

function parseToolParameters(filePath: string, value: unknown) {
  try {
    return fromJSONSchema(value as Parameters<typeof fromJSONSchema>[0])
  } catch (error) {
    throw new Error(
      `Invalid tool schema in ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export async function loadToolOverrides(toolOverridesDir: string) {
  const overrides = new Map<string, ToolOverride>()
  const names = await listFileBaseNames(toolOverridesDir, [".txt", ".json"])

  await Promise.all(
    names.map(async (name) => {
      const [description, schema] = await Promise.all([
        readText(path.join(toolOverridesDir, `${name}.txt`)),
        readJsonObject(path.join(toolOverridesDir, `${name}.json`)),
      ])

      if (description === undefined && schema === undefined) return

      overrides.set(name, {
        ...(description !== undefined ? { description: description.trimEnd() } : {}),
        ...(schema !== undefined
          ? { parameters: parseToolParameters(path.join(toolOverridesDir, `${name}.json`), schema) }
          : {}),
      })
    }),
  )

  return overrides
}
