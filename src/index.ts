import path from "path"
import { fileURLToPath } from "url"

export { createPlugin, extendSkillPaths } from "./runtime/plugin"

export type {
  ChatMessage,
  ChatMessagePart,
  ChatMessagesOutput,
  ChatSystemOutput,
  PluginConfig,
  PluginDefinition,
  PluginHooks,
  ServerInput,
  SessionCompactingOutput,
  ToolDefinitionInput,
  ToolDefinitionOutput,
} from "./runtime/types"

import { createPlugin as createPluginFactory } from "./runtime/plugin"

const root = path.dirname(fileURLToPath(import.meta.url))

export default createPluginFactory(root)
