import fs from "fs/promises"
import os from "os"
import path from "path"
import { z } from "zod"

type SkillInfo = {
  name: string
  description: string
  location: string
  content: string
}

async function exists(filePath: string) {
  return fs.stat(filePath).then(() => true).catch(() => false)
}

async function readSkill(filePath: string): Promise<SkillInfo | undefined> {
  const text = await fs.readFile(filePath, "utf8").catch(() => undefined)
  if (text === undefined) return

  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const frontmatter = match?.[1] ?? ""
  const content = (match?.[2] ?? text).trim()
  const name = frontmatter.match(/^\s*name:\s*(.+?)\s*$/m)?.[1]?.trim() ?? path.basename(path.dirname(filePath))
  const description = frontmatter.match(/^\s*description:\s*(.+?)\s*$/m)?.[1]?.trim() ?? ""

  if (!name) return
  return { name, description, location: filePath, content }
}

async function walk(root: string, out: string[], limit = 300) {
  if (out.length >= limit) return
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (out.length >= limit) break
    const filePath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      await walk(filePath, out, limit)
      continue
    }
    if (entry.isFile() && entry.name === "SKILL.md") out.push(filePath)
  }
}

async function discoverSkills(worktree: string, directory: string) {
  const roots = [
    path.join(worktree, ".opencode"),
    path.join(worktree, "skills"),
    path.join(worktree, "skill"),
    path.join(directory, ".opencode"),
    path.join(directory, "skills"),
    path.join(directory, "skill"),
    path.join(os.homedir(), ".config/opencode"),
    path.join(os.homedir(), ".claude"),
    path.join(os.homedir(), ".agents"),
  ]

  const files: string[] = []
  for (const root of roots) {
    if (!(await exists(root))) continue
    await walk(root, files)
  }

  const skills: SkillInfo[] = []
  for (const filePath of files) {
    const skill = await readSkill(filePath)
    if (skill) skills.push(skill)
  }
  return skills
}

export default {
  description:
    "Load a specialized skill that provides domain-specific instructions and workflows. No skills are currently available.",
  args: {
    name: z.string().describe("The name of the skill to load"),
  },
  async execute(
    params: { name: string },
    ctx: { worktree: string; directory: string; ask(input: { permission: string; patterns: string[]; always: string[]; metadata: Record<string, unknown> }): Promise<void> },
  ) {
    await ctx.ask({
      permission: "skill",
      patterns: [params.name],
      always: [params.name],
      metadata: {},
    })

    const skills = await discoverSkills(ctx.worktree, ctx.directory)
    const skill = skills.find((item) => item.name === params.name)

    if (!skill) {
      const available = skills.map((item) => item.name).join(", ")
      throw new Error(`Skill "${params.name}" not found. Available skills: ${available || "none"}`)
    }

    return [
      `<skill_content name="${skill.name}">`,
      `# Skill: ${skill.name}`,
      "",
      skill.content,
      "",
      `Base directory for this skill: ${path.dirname(skill.location)}`,
      "</skill_content>",
    ].join("\n")
  },
}
