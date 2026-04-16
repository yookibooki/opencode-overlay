import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  loadModelPairs,
  loadPrefixPairs,
  loadTools,
  normalizeToolId,
  rewriteByPrefix,
  rewriteStringsInPlace,
  type MessagesTransformOutput,
  type SystemTransformOutput,
  type ToolDefinitionOutput,
} from "./overlay-helpers.ts"

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const modelPath = path.join(moduleDir, "model.txt")
const agentDir = path.join(moduleDir, "agent")
const toolDir = path.join(moduleDir, "tool")
const refDir = path.join(moduleDir, "_refs")

const model = await fs.readFile(modelPath, "utf8")

const [tools, modelPairs, rootPairs, agentPairs] = await Promise.all([
  loadTools(toolDir),
  loadModelPairs(path.join(refDir, "model"), model),
  loadPrefixPairs(path.join(refDir, "root"), moduleDir),
  loadPrefixPairs(path.join(refDir, "agent"), agentDir),
])

const systemRewrites = [...modelPairs, ...rootPairs, ...agentPairs]
const messageRewrites = [...rootPairs]

const plugin = {
  id: "opencode-overlay",
  server() {
    return {
      "experimental.chat.system.transform"(_input: unknown, output: SystemTransformOutput): void {
        rewriteStringsInPlace(output.system, systemRewrites)
      },
      "experimental.chat.messages.transform"(_input: unknown, output: MessagesTransformOutput): void {
        for (const message of output.messages) {
          for (const part of message.parts) {
            if (part.type !== "text") continue
            part.text = rewriteByPrefix(part.text, messageRewrites)
          }
        }
      },
      "tool.definition"({ toolID }: { toolID: string }, output: ToolDefinitionOutput): void {
        const override = tools.get(normalizeToolId(toolID))
        if (override !== undefined) output.description = override
      },
    }
  },
}

export default plugin
