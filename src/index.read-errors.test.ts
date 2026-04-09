import { expect, test } from "bun:test"
import { spawnSync } from "child_process"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { pathToFileURL } from "url"

async function runScenario(env: Record<string, string | undefined>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-thrifty-read-errors-"))

  try {
    const pluginUrl = `${pathToFileURL(path.join(process.cwd(), "src", "index.ts")).href}?read-errors`
    const scriptPath = path.join(root, "scenario.ts")
    const script = `import { mock } from "bun:test"

const readErrorCode = Bun.env.READ_ERROR_CODE ?? ""
const readdirErrorCode = Bun.env.READDIR_ERROR_CODE ?? ""
const expectedErrorCode = Bun.env.EXPECTED_ERROR_CODE ?? ""
const checkCompactionUnset = Bun.env.CHECK_COMPACTION_UNSET === "1"

const systemPath = ${JSON.stringify(path.join(process.cwd(), "src", "system.txt"))}
const compactionPath = ${JSON.stringify(path.join(process.cwd(), "src", "compaction.txt"))}
const skillsPath = ${JSON.stringify(path.join(process.cwd(), "src", "skills.txt"))}

mock.module("fs/promises", () => {
  const readFile = mock(async (filePath: string) => {
    if (filePath === systemPath || filePath === skillsPath) {
      return Bun.file(filePath).text()
    }

    if (filePath === compactionPath) {
      if (readErrorCode !== "") {
        throw Object.assign(new Error(readErrorCode), { code: readErrorCode })
      }

      return Bun.file(filePath).text()
    }

    throw new Error("Unexpected readFile call: " + filePath)
  })

  const readdir = mock(async () => {
    if (readdirErrorCode !== "") {
      throw Object.assign(new Error(readdirErrorCode), { code: readdirErrorCode })
    }

    return []
  })

  return {
    default: { readFile, readdir },
    readFile,
    readdir,
  }
})

const { default: plugin } = await import(${JSON.stringify(pluginUrl)})

try {
  const hooks = await plugin.server()

  if (expectedErrorCode !== "") {
    throw new Error("expected plugin.server() to reject with " + expectedErrorCode)
  }

  if (checkCompactionUnset) {
    const compaction = {}
    await hooks["experimental.session.compacting"]({}, compaction)

    if (compaction.prompt !== undefined) {
      throw new Error("expected missing optional file to leave the compaction prompt unset")
    }
  }
} catch (error) {
  if (expectedErrorCode === "" || !String(error).includes(expectedErrorCode)) {
    throw error
  }
}
`

    await fs.writeFile(scriptPath, script)

    const result = spawnSync("bun", ["test", scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      encoding: "utf8",
    })

    expect(result.status).toBe(0)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
}

test("optional file reads ignore ENOENT but surface other errors", async () => {
  await runScenario({
    READ_ERROR_CODE: "ENOENT",
    READDIR_ERROR_CODE: "",
    CHECK_COMPACTION_UNSET: "1",
  })

  await runScenario({
    READ_ERROR_CODE: "EACCES",
    READDIR_ERROR_CODE: "",
    EXPECTED_ERROR_CODE: "EACCES",
  })
})

test("optional directory scans ignore ENOENT but surface other errors", async () => {
  await runScenario({
    READ_ERROR_CODE: "",
    READDIR_ERROR_CODE: "ENOENT",
  })

  await runScenario({
    READ_ERROR_CODE: "",
    READDIR_ERROR_CODE: "EACCES",
    EXPECTED_ERROR_CODE: "EACCES",
  })
})
