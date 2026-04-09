#!/usr/bin/env bun

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const srcRoot = path.join(repoRoot, "src")
const distRoot = path.join(repoRoot, "dist")

/** @typedef {{ name: string, isFile(): boolean, isDirectory(): boolean }} DirEntryLike */

async function collectTests(dir, out) {
  const entries = (await fs.readdir(dir, { withFileTypes: true }).catch(() => []))
    .sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectTests(full, out)
      continue
    }

    if (entry.isFile() && /\.test\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      out.push(path.relative(repoRoot, full))
    }
  }
}

async function copyTree(srcDir, destDir) {
  const entries = /** @type {DirEntryLike[]} */ (await fs.readdir(srcDir, { withFileTypes: true }))
    .sort((a, b) => a.name.localeCompare(b.name))

  await fs.mkdir(destDir, { recursive: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath)
      continue
    }

    if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

async function copyRootTextFiles(srcDir, destDir) {
  const entries = (await fs.readdir(srcDir, { withFileTypes: true }).catch(() => []))
    .sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".txt")) continue

    await fs.copyFile(path.join(srcDir, entry.name), path.join(destDir, entry.name))
  }
}

function parseJsonLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)]
      } catch {
        return []
      }
    })
}

async function runLivePromptCheck() {
  const buildResult = spawnSync(process.execPath, ["run", "build"], {
    cwd: repoRoot,
    stdio: "inherit",
  })

  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1)
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-thrifty-live-"))

  try {
    const pluginDir = path.join(tempRoot, ".opencode", "plugins")

    await fs.mkdir(pluginDir, { recursive: true })
    await fs.copyFile(path.join(distRoot, "index.js"), path.join(pluginDir, "opencode-thrifty.js"))
    await copyRootTextFiles(distRoot, pluginDir)
    await copyTree(path.join(distRoot, "agent"), path.join(pluginDir, "agent"))
    await copyTree(path.join(distRoot, "tool"), path.join(pluginDir, "tool"))
    await copyTree(path.join(distRoot, "_snapshots"), path.join(pluginDir, "_snapshots"))

    const result = spawnSync(
      "opencode",
      ["run", "--format", "json", "--model", "openai/gpt-5.4-mini", "reply with exactly ok"],
      {
        cwd: tempRoot,
        encoding: "utf8",
      },
    )

    if (result.status !== 0) {
      throw new Error(
        `Live prompt check failed with exit code ${result.status ?? "unknown"}\n${result.stderr ?? ""}`,
      )
    }

    const events = parseJsonLines(result.stdout ?? "")
    if (!events.some((event) => event?.type === "text" && event?.part?.text === "ok")) {
      throw new Error(`Live prompt check did not return ok\n${result.stdout ?? ""}\n${result.stderr ?? ""}`)
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }

  console.log("Live prompt check passed.")
}

const tests = []
await collectTests(srcRoot, tests)

if (!tests.length) {
  console.log("No src tests found.")
  process.exit(0)
}

const result = spawnSync(process.execPath, ["test", ...tests], {
  cwd: repoRoot,
  stdio: "inherit",
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

await runLivePromptCheck()
