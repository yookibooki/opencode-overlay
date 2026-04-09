import fs from "fs/promises"

export type DirEntryLike = {
  name: string
  isFile(): boolean
  isDirectory(): boolean
}

export type JsonObject = Record<string, unknown>

export function isMissingFileError(error: unknown) {
  return typeof error === "object" && error !== null && Reflect.get(error, "code") === "ENOENT"
}

export function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function readText(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8")
  } catch (error) {
    if (isMissingFileError(error)) return undefined
    throw error
  }
}

export async function readJsonObject(filePath: string) {
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

export async function listFileBaseNames(dir: string, extensions: string[]) {
  let entries: DirEntryLike[]

  try {
    entries = (await fs.readdir(dir, { withFileTypes: true })) as DirEntryLike[]
  } catch (error) {
    if (isMissingFileError(error)) return []
    throw error
  }

  const names = new Set<string>()

  for (const entry of entries) {
    if (!entry.isFile()) continue

    for (const extension of extensions) {
      if (entry.name.endsWith(extension)) {
        names.add(entry.name.slice(0, -extension.length))
        break
      }
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b))
}
