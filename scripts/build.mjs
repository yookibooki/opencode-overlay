#!/usr/bin/env bun

import fs from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const srcRoot = path.join(repoRoot, "src")
const distRoot = path.join(repoRoot, "dist")

/** @typedef {{ name: string, isFile(): boolean, isDirectory(): boolean }} DirEntryLike */

async function removeDir(dir) {
  await fs.rm(dir, { recursive: true, force: true })
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest))
  await fs.copyFile(src, dest)
}

/**
 * @param {string} srcDir
 * @param {string} destDir
 * @param {(srcPath: string, entry: DirEntryLike) => boolean} [shouldCopy]
 */
async function copyTree(srcDir, destDir, shouldCopy) {
  const entries = /** @type {DirEntryLike[]} */ (
    await fs.readdir(srcDir, { withFileTypes: true }).catch(() => [])
  )
  entries.sort((a, b) => a.name.localeCompare(b.name))

  await ensureDir(destDir)

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)
    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath, shouldCopy)
      continue
    }

    if (shouldCopy && !shouldCopy(srcPath, entry)) continue

    if (entry.isFile()) {
      await copyFile(srcPath, destPath)
    }
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

  const toolEntries = (await fs.readdir(path.join(srcRoot, "tools"), { withFileTypes: true })).filter(
    (entry) => entry.isFile() && entry.name.endsWith(".ts"),
  )

  if (toolEntries.length > 0) {
    await runBunBuild("tool runtime", {
      entrypoints: toolEntries.map((entry) => path.join(srcRoot, "tools", entry.name)),
      outdir: path.join(distRoot, "tools"),
      target: "bun",
      format: "esm",
      external: ["zod"],
    })
  }

  runTypeDeclarations()

  await copyFile(path.join(srcRoot, "system.txt"), path.join(distRoot, "system.txt"))
  await copyTree(path.join(srcRoot, "prompts"), path.join(distRoot, "prompts"))
  await copyTree(path.join(srcRoot, "tools"), path.join(distRoot, "tools"), (_srcPath, entry) => entry.isFile() && entry.name.endsWith(".txt"))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exit(1)
})
