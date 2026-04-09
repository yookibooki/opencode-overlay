export type ServerInput = {
  directory?: string
  worktree?: string
}

export type SkillPathsConfig = {
  paths?: string[]
  urls?: string[]
}

export type PluginConfig = {
  skills?: SkillPathsConfig
  [key: string]: unknown
}

export type ChatSystemOutput = {
  system: string[]
}

export type ChatMessagePart = {
  type: string
  text: string
}

export type ChatMessage = {
  parts: ChatMessagePart[]
}

export type ChatMessagesOutput = {
  messages: ChatMessage[]
}

export type SessionCompactingOutput = {
  prompt?: string
}

export type ToolDefinitionInput = {
  toolID: string
}

export type ToolDefinitionOutput = {
  description: string
  parameters: unknown
}

export type PluginHooks = {
  config?: (cfg: PluginConfig) => Promise<void> | void
  "experimental.chat.system.transform"?: (
    input: unknown,
    output: ChatSystemOutput,
  ) => Promise<void> | void
  "experimental.chat.messages.transform"?: (
    input: unknown,
    output: ChatMessagesOutput,
  ) => Promise<void> | void
  "experimental.session.compacting"?: (
    input: unknown,
    output: SessionCompactingOutput,
  ) => Promise<void> | void
  "tool.definition"?: (input: ToolDefinitionInput, output: ToolDefinitionOutput) => Promise<void> | void
}

export type PluginDefinition = {
  id: string
  server: (input?: ServerInput) => Promise<PluginHooks>
}
