import path from "path"

export type RuntimePaths = {
  root: string
  system: string
  compaction: string
  skills: string
  snapshots: {
    root: string
    system: string
    agent: string
    session: string
  }
  overrides: {
    root: string
    agent: string
    tool: string
  }
}

export function createRuntimePaths(root: string): RuntimePaths {
  return {
    root,
    system: path.join(root, "system.txt"),
    compaction: path.join(root, "compaction.txt"),
    skills: path.join(root, "skills.txt"),
    snapshots: {
      root: path.join(root, "_snapshots"),
      system: path.join(root, "_snapshots", "system"),
      agent: path.join(root, "_snapshots", "agent"),
      session: path.join(root, "_snapshots", "session"),
    },
    overrides: {
      root,
      agent: path.join(root, "agent"),
      tool: path.join(root, "tool"),
    },
  }
}
