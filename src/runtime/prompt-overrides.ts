import path from "path"

import { listFileBaseNames, readText } from "./fs"
import { sortByLengthDesc, type PrefixPair } from "./text"

export type PromptOverrideResolver = (name: string) => Promise<string | undefined> | string | undefined

export async function loadPromptPairs(
  snapshotDir: string,
  getOverride: PromptOverrideResolver,
  priority = 0,
) {
  const names = await listFileBaseNames(snapshotDir, [".txt"])
  const pairs: Array<PrefixPair | undefined> = await Promise.all(
    names.map(async (name) => {
      const builtin = await readText(path.join(snapshotDir, `${name}.txt`))
      if (builtin === undefined) return undefined

      const override = await getOverride(name)
      if (override === undefined) return undefined

      return { builtin, override, priority }
    }),
  )

  return sortByLengthDesc(pairs.filter((pair): pair is PrefixPair => pair !== undefined))
}
