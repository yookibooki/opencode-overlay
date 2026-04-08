import { expect, test } from "bun:test"
import fs from "fs/promises"
import path from "path"

type PromptManifest = {
  system: string[]
  agent: string[]
  session: string[]
}

async function listPromptNames(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
    .map((entry) => path.basename(entry.name, ".txt"))
    .sort((a, b) => a.localeCompare(b))
}

test("prompt manifest tracks snapshot-paired local overrides", async () => {
  const root = process.cwd()
  const promptsRoot = path.join(root, "src", "prompts")
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, "src", "prompts.manifest.json"), "utf8"),
  ) as PromptManifest

  const [systemSnapshots, agentSnapshots, sessionSnapshots, agentOverrides, sessionOverrides] = await Promise.all([
    listPromptNames(path.join(promptsRoot, "_snapshots", "system")),
    listPromptNames(path.join(promptsRoot, "_snapshots", "agent")),
    listPromptNames(path.join(promptsRoot, "_snapshots", "session")),
    listPromptNames(path.join(promptsRoot, "agent")),
    listPromptNames(path.join(promptsRoot, "session")),
  ])

  expect(systemSnapshots).toEqual(manifest.system)
  expect(agentSnapshots).toEqual(manifest.agent)
  expect(sessionSnapshots).toEqual(manifest.session)

  for (const name of agentOverrides) {
    expect(agentSnapshots).toContain(name)
    expect(manifest.agent).toContain(name)
  }

  const namedSessionOverrides = sessionOverrides.filter((name) => name !== "compaction")

  for (const name of namedSessionOverrides) {
    expect(sessionSnapshots).toContain(name)
    expect(manifest.session).toContain(name)
  }
})
