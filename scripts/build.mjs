#!/usr/bin/env bun

import fs from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { copyRootTextFiles, copyTree, isTextAsset, isToolAsset } from "./shared.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const srcRoot = path.join(repoRoot, "src")
const distRoot = path.join(repoRoot, "dist")

async function removeDir(dir) {
  await fs.rm(dir, { recursive: true, force: true })
}

async function requireDirectory(dir, label) {
  try {
    const stat = await fs.stat(dir)
    if (!stat.isDirectory()) {
      throw new Error(`${label} must be a directory: ${dir}`)
    }
  } catch (error) {
    if (error instanceof Error && Reflect.get(error, "code") === "ENOENT") {
      throw new Error(`${label} is missing: ${dir}`)
    }

    throw error
  }
}

function printBuildFailure(label, result) {
  const logs = Array.isArray(result?.logs) ? result.logs : []
  for (const log of logs) {
    const message = typeof log?.message === "string" ? log.message : String(log)
    if (message.trim()) console.error(message)
  }
  throw new Error(`Build failed for ${label}`)
}

async function runBunBuild(label, options) {
  const result = await Bun.build(options)
  if (!result.success) {
    printBuildFailure(label, result)
  }
}

function runTypeDeclarations() {
  const result = spawnSync(process.execPath, ["x", "tsc", "-p", "tsconfig.build.json"], {
    cwd: repoRoot,
    stdio: "inherit",
  })

  if (result.status !== 0) {
    throw new Error(`TypeScript declaration build failed with exit code ${result.status ?? "unknown"}`)
  }
}

async function main() {
  await removeDir(distRoot)

  await runBunBuild("main runtime", {
    entrypoints: [path.join(srcRoot, "index.ts")],
    outdir: distRoot,
    target: "bun",
    format: "esm",
  })

  const toolEntries = (await fs.readdir(path.join(srcRoot, "tool"), { withFileTypes: true })).filter(
    (entry) => entry.isFile() && entry.name.endsWith(".ts"),
  )

  if (toolEntries.length > 0) {
    await runBunBuild("tool runtime", {
      entrypoints: toolEntries.map((entry) => path.join(srcRoot, "tool", entry.name)),
      outdir: path.join(distRoot, "tool"),
      target: "bun",
      format: "esm",
      external: ["zod"],
    })
  }

  runTypeDeclarations()

  await copyRootTextFiles(srcRoot, distRoot)
  await requireDirectory(path.join(srcRoot, "_snapshots"), "Source snapshots tree")
  await Promise.all([
    requireDirectory(path.join(srcRoot, "_snapshots", "system"), "System prompt snapshots"),
    requireDirectory(path.join(srcRoot, "_snapshots", "agent"), "Agent prompt snapshots"),
    requireDirectory(path.join(srcRoot, "_snapshots", "session"), "Session prompt snapshots"),
  ])
  await copyTree(path.join(srcRoot, "_snapshots"), path.join(distRoot, "_snapshots"))
  await copyTree(path.join(srcRoot, "agent"), path.join(distRoot, "agent"), (_srcPath, entry) => isTextAsset(entry))
  await copyTree(path.join(srcRoot, "tool"), path.join(distRoot, "tool"), (_srcPath, entry) => isToolAsset(entry))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exit(1)
})
