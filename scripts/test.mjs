#!/usr/bin/env bun

import fs from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const srcRoot = path.join(repoRoot, "src")

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

process.exit(result.status ?? 1)
