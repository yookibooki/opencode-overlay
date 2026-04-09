import fs from "node:fs/promises"
import path from "node:path"

export function isTextAsset(entry) {
  return entry.isFile() && entry.name.endsWith(".txt")
}

export function isToolAsset(entry) {
  return entry.isFile() && (entry.name.endsWith(".txt") || entry.name.endsWith(".json"))
}

export async function copyTree(srcDir, destDir, shouldCopy = () => true) {
  const entries = (await fs.readdir(srcDir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))

  await fs.mkdir(destDir, { recursive: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath, shouldCopy)
      continue
    }

    if (entry.isFile() && shouldCopy(srcPath, entry)) {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

export async function copyRootTextFiles(srcDir, destDir) {
  const entries = (await fs.readdir(srcDir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))

  await fs.mkdir(destDir, { recursive: true })

  for (const entry of entries) {
    if (!isTextAsset(entry)) continue

    await fs.copyFile(path.join(srcDir, entry.name), path.join(destDir, entry.name))
  }
}

export async function collectTests(dir, root = dir, out = []) {
  const entries = (await fs.readdir(dir, { withFileTypes: true }).catch(() => [])).sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectTests(full, root, out)
      continue
    }

    if (entry.isFile() && /\.test\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      out.push(path.relative(root, full))
    }
  }

  return out
}
