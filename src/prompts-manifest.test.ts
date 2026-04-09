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
  const snapshotsRoot = path.join(root, "src", "_snapshots")
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, "src", "prompts.manifest.json"), "utf8"),
  ) as PromptManifest

  const [systemSnapshots, agentSnapshots, sessionSnapshots, agentOverrides, rootOverrides] = await Promise.all([
    listPromptNames(path.join(snapshotsRoot, "system")),
    listPromptNames(path.join(snapshotsRoot, "agent")),
    listPromptNames(path.join(snapshotsRoot, "session")),
    listPromptNames(path.join(root, "src", "agent")),
    listPromptNames(path.join(root, "src")),
  ])

  expect(systemSnapshots).toEqual(manifest.system)
  expect(agentSnapshots).toEqual(manifest.agent)
  expect(sessionSnapshots).toEqual(manifest.session)

  for (const name of agentOverrides) {
    expect(agentSnapshots).toContain(name)
    expect(manifest.agent).toContain(name)
  }

  const namedSystemOverrides = rootOverrides.filter((name) => systemSnapshots.includes(name))

  for (const name of namedSystemOverrides) {
    expect(systemSnapshots).toContain(name)
    expect(manifest.system).toContain(name)
  }

  const namedSessionOverrides = rootOverrides.filter((name) => sessionSnapshots.includes(name))

  for (const name of namedSessionOverrides) {
    expect(sessionSnapshots).toContain(name)
    expect(manifest.session).toContain(name)
  }
})
