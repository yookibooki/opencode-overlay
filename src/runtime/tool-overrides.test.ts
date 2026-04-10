import { expect, test } from "bun:test"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { toJSONSchema } from "zod"

import { loadToolOverrides } from "./tool-overrides"

async function withTempDir<T>(fn: (root: string) => Promise<T>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-overlay-tools-"))

  try {
    return await fn(root)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
}

test("loads tool overrides and validates schema files", async () => {
  await withTempDir(async (root) => {
    await fs.writeFile(path.join(root, "skill.txt"), "skill override\n")
    await fs.writeFile(
      path.join(root, "skill.json"),
      JSON.stringify({
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
        additionalProperties: false,
      }),
    )

    const overrides = await loadToolOverrides(root)
    const override = overrides.get("skill")

    expect(override?.description).toBe("skill override")
    expect(override?.parameters).toBeDefined()

    const { $schema: _schema, ...jsonSchema } = toJSONSchema(override?.parameters as never) as {
      $schema?: string
      [key: string]: unknown
    }

    expect(jsonSchema).toEqual({
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
      additionalProperties: false,
    })
  })
})

test("reports invalid tool schema paths", async () => {
  await withTempDir(async (root) => {
    await fs.writeFile(path.join(root, "broken.json"), JSON.stringify({ type: "not-a-real-schema-type" }))

    await expect(loadToolOverrides(root)).rejects.toThrow(/Invalid tool schema in .*broken\.json/)
  })
})
