#!/usr/bin/env bun

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { collectTests, copyRootTextFiles, copyTree } from "./shared.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const srcRoot = path.join(repoRoot, "src")
const distRoot = path.join(repoRoot, "dist")

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

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-overlay-live-"))

  try {
    const pluginDir = path.join(tempRoot, ".opencode", "plugins")

    await fs.mkdir(pluginDir, { recursive: true })
    await fs.copyFile(path.join(distRoot, "index.js"), path.join(pluginDir, "opencode-overlay.js"))
    await copyRootTextFiles(distRoot, pluginDir)
    await copyTree(path.join(distRoot, "agent"), path.join(pluginDir, "agent"))
    await copyTree(path.join(distRoot, "tool"), path.join(pluginDir, "tool"))
    await copyTree(path.join(distRoot, "_snapshots"), path.join(pluginDir, "_snapshots"))

    const prompts = [
      { prompt: "hi", maxInputTokens: 1800, maxTotalTokens: 2000 },
      { prompt: "Explain context in Go", maxInputTokens: 2200, maxTotalTokens: 2400 },
    ]

    for (const { prompt, maxInputTokens, maxTotalTokens } of prompts) {
      const result = spawnSync(
        "opencode",
        ["run", "--format", "json", "--model", "openai/gpt-5.4-mini", prompt],
        {
          cwd: tempRoot,
          encoding: "utf8",
        },
      )

      if (result.status !== 0) {
        throw new Error(
          `Live prompt check failed for ${JSON.stringify(prompt)} with exit code ${result.status ?? "unknown"}\n${result.stderr ?? ""}`,
        )
      }

      const events = parseJsonLines(result.stdout ?? "")
      const textEvent = events.find((event) => event?.type === "text")
      if (!textEvent) {
        throw new Error(`Live prompt check produced no text event for ${JSON.stringify(prompt)}`)
      }

      const finishes = events.filter((event) => event?.type === "step_finish")
      const last = finishes.at(-1)?.part?.tokens
      if (!last) {
        throw new Error(`Live prompt check produced no token data for ${JSON.stringify(prompt)}`)
      }

      if (last.input > maxInputTokens || last.total > maxTotalTokens) {
        throw new Error(
          `Token budget regression for ${JSON.stringify(prompt)}: input=${last.input}, total=${last.total}`,
        )
      }
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }

  console.log("Live prompt check passed.")
}

const tests = await collectTests(srcRoot, repoRoot)

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
