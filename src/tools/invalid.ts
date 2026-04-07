import { z } from "zod"

export default {
  description: "Do not use",
  args: {
    tool: z.string(),
    error: z.string(),
  },
  async execute(params: { tool: string; error: string }) {
    return `The arguments provided to the tool are invalid: ${params.error}`
  },
}
