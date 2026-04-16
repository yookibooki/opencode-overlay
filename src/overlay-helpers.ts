import fs from "node:fs/promises"
import path from "node:path"

export type PrefixPair = Readonly<{
  builtin: string
  override: string
}>

export type SystemTransformOutput = {
  system: string[]
}

export type MessagePart = {
  type: string
  text: string
}

export type Message = {
  parts: MessagePart[]
}

export type MessagesTransformOutput = {
  messages: Message[]
}

export type ToolDefinitionOutput = {
  description: string
}

export const normalizeToolId = (name: string) => (name === "ls" ? "list" : name.replaceAll("-", "_"))

export const sortPrefixPairs = (pairs: PrefixPair[]) =>
  [...pairs].sort(
    (left, right) => right.builtin.length - left.builtin.length || left.builtin.localeCompare(right.builtin),
  )

export const loadPrefixPairs = async (sourceDir: string, overrideDir: string): Promise<PrefixPair[]> => {
  const names = (await fs.readdir(sourceDir)).filter((name) => name.endsWith(".ref")).sort()
  if (names.length === 0) throw new Error(`No .ref files found in ${sourceDir}`)
  const pairs = await Promise.all(
    names.map(async (name) => {
      const stem = path.basename(name, ".ref")
      const [builtin, override] = await Promise.all([
        fs.readFile(path.join(sourceDir, name), "utf8"),
        fs.readFile(path.join(overrideDir, `${stem}.txt`), "utf8"),
      ])

      return { builtin, override }
    }),
  )

  return sortPrefixPairs(pairs)
}

export const loadModelPairs = async (sourceDir: string, override: string): Promise<PrefixPair[]> => {
  const names = (await fs.readdir(sourceDir)).filter((name) => name.endsWith(".ref")).sort()
  if (names.length === 0) throw new Error(`No .ref files found in ${sourceDir}`)
  const pairs = await Promise.all(
    names.map(async (name) => ({
      builtin: await fs.readFile(path.join(sourceDir, name), "utf8"),
      override,
    })),
  )

  return sortPrefixPairs(pairs)
}

export const loadTools = async (toolDir: string) => {
  const names = (await fs.readdir(toolDir)).filter((name) => name.endsWith(".txt")).sort()
  if (names.length === 0) throw new Error(`No .txt tool definitions found in ${toolDir}`)
  const entries = await Promise.all(
    names.map(async (name) => [
      normalizeToolId(path.basename(name, ".txt")),
      (await fs.readFile(path.join(toolDir, name), "utf8")).trimEnd(),
    ] as const),
  )

  return new Map(entries)
}

export const rewriteByPrefix = (text: string, pairs: readonly PrefixPair[]) => {
  for (const pair of pairs) {
    if (text.startsWith(pair.builtin)) return `${pair.override}${text.slice(pair.builtin.length)}`
    if (pair.builtin.startsWith(text)) return pair.override
  }

  return text
}

export const rewriteStringsInPlace = (strings: string[], pairs: readonly PrefixPair[]) => {
  for (let index = 0; index < strings.length; index++) {
    strings[index] = rewriteByPrefix(strings[index], pairs)
  }
}
