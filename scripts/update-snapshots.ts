#!/usr/bin/env bun

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

type TreeEntry = {
  path: string
  type: string
}

type Manifest = {
  system: string[]
  agent: string[]
  session: string[]
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const upstreamOwner = "anomalyco"
const upstreamRepo = "opencode"
const upstreamRef = "dev"
const upstreamBase = `packages/opencode/src`
const sessionPromptPrefix = `${upstreamBase}/session/prompt/`
const agentPromptPrefix = `${upstreamBase}/agent/prompt/`
const agentGeneratePath = `${upstreamBase}/agent/generate.txt`

const systemNames = ["default", "anthropic", "gpt", "gemini", "codex", "beast", "kimi", "trinity"]
const manifestPath = path.join(repoRoot, "src", "prompts.manifest.json")
const snapshotRoot = path.join(repoRoot, "src", "_snapshots")

type SnapshotGroup = {
  kind: "system" | "session" | "agent"
  names: string[]
  resolvePath: (name: string) => string
}

async function fetchTree(): Promise<TreeEntry[]> {
  const url = `https://api.github.com/repos/${upstreamOwner}/${upstreamRepo}/git/trees/${upstreamRef}?recursive=1`
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "opencode-thrifty",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch upstream tree: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { truncated?: boolean; tree?: TreeEntry[] }
  if (data.truncated) {
    throw new Error("Upstream tree response was truncated")
  }

  return data.tree ?? []
}

async function fetchText(filePath: string) {
  const url = `https://raw.githubusercontent.com/${upstreamOwner}/${upstreamRepo}/${upstreamRef}/${filePath}`
  const response = await fetch(url, {
    headers: {
      "User-Agent": "opencode-thrifty",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

function sortNames(names: string[]) {
  return [...new Set(names)].sort((a, b) => a.localeCompare(b))
}

async function writeSnapshots(groups: SnapshotGroup[]) {
  await fs.rm(snapshotRoot, { recursive: true, force: true })

  for (const { kind, names, resolvePath } of groups) {
    await Promise.all(
      names.map(async (name) => {
        const out = path.join(snapshotRoot, kind, `${name}.txt`)
        await fs.mkdir(path.dirname(out), { recursive: true })
        await fs.writeFile(out, await fetchText(resolvePath(name)))
      }),
    )
  }
}

export function buildSnapshotManifest(tree: TreeEntry[]): Manifest {
  const paths = new Set(tree.filter((entry) => entry.type === "blob").map((entry) => entry.path))

  const system = sortNames(systemNames.filter((name) => paths.has(`${sessionPromptPrefix}${name}.txt`)))
  const session = sortNames(
    tree
      .filter((entry) => entry.type === "blob" && entry.path.startsWith(sessionPromptPrefix) && entry.path.endsWith(".txt"))
      .map((entry) => path.basename(entry.path, ".txt"))
      .filter((name) => !system.includes(name)),
  )
  const agent = sortNames(
    tree
      .filter(
        (entry) =>
          entry.type === "blob" &&
          (entry.path === agentGeneratePath || (entry.path.startsWith(agentPromptPrefix) && entry.path.endsWith(".txt"))),
      )
      .map((entry) => path.basename(entry.path, ".txt")),
  )

  return { system, agent, session }
}

async function main() {
  const tree = await fetchTree()
  const manifest = buildSnapshotManifest(tree)
  await writeSnapshots([
    { kind: "system", names: manifest.system, resolvePath: (name) => `${sessionPromptPrefix}${name}.txt` },
    { kind: "session", names: manifest.session, resolvePath: (name) => `${sessionPromptPrefix}${name}.txt` },
    {
      kind: "agent",
      names: manifest.agent,
      resolvePath: (name) => (name === "generate" ? agentGeneratePath : `${agentPromptPrefix}${name}.txt`),
    },
  ])
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

if (import.meta.main) {
  await main()
}
