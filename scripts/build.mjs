#!/usr/bin/env bun

;(async () => {
  const fs = await import("node:fs/promises")
  const path = await import("node:path")
  const { copyTxtFiles, findRemoteTxt, readTxtNames, remoteTxtPaths } = await import("./build-helpers.ts")

  const rootDir = process.cwd()
  const srcDir = path.join(rootDir, "src")
  const distDir = path.join(rootDir, "dist")
  const cacheDir = path.join(rootDir, ".cache", "opencode-overlay")

  const upstream = {
    owner: process.env.OPENCODE_UPSTREAM_OWNER ?? "anomalyco",
    repo: process.env.OPENCODE_UPSTREAM_REPO ?? "opencode",
    ref: process.env.OPENCODE_UPSTREAM_REF ?? "dev",
    srcRoot: "packages/opencode/src",
  }

  const promptDir = path.posix.join(upstream.srcRoot, "session/prompt")
  const agentDir = path.posix.join(upstream.srcRoot, "agent")

  const refDir = path.join(distDir, "_refs")
  const modelRefDir = path.join(refDir, "model")
  const rootRefDir = path.join(refDir, "root")
  const agentRefDir = path.join(refDir, "agent")

  const cachePath = (...segments) => path.join(cacheDir, upstream.owner, upstream.repo, upstream.ref, ...segments)

  const readCachedText = (filePath) => fs.readFile(filePath, "utf8").catch(() => undefined)

  const writeCachedText = async (filePath, text) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, text)
  }

  const readCachedJson = async (filePath) => {
    const text = await readCachedText(filePath)
    if (text === undefined) return undefined

    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  }

  const writeCachedJson = async (filePath, value) => {
    await writeCachedText(filePath, `${JSON.stringify(value)}\n`)
  }

  const fetchJsonCached = async (filePath, url) => {
    const cacheFile = cachePath(filePath)
    const cached = await readCachedJson(cacheFile)
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "opencode-overlay",
    }

    if (cached?.etag) headers["If-None-Match"] = cached.etag

    try {
      const response = await fetch(url, { headers })

      if (response.status === 304 && cached?.body !== undefined) return cached.body
      if (!response.ok) {
        if (cached?.body !== undefined) return cached.body
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
      }

      const body = await response.json()
      await writeCachedJson(cacheFile, { etag: response.headers.get("etag"), body })
      return body
    } catch (error) {
      if (cached?.body !== undefined) return cached.body
      throw error
    }
  }

  const isNotFound = (error) => error instanceof Error && /404/.test(error.message)

  const resolveCommitSha = async () => {
    if (/^[0-9a-f]{40}$/i.test(upstream.ref)) return upstream.ref

    const refEndpoints = [
      [`ref-heads-${upstream.ref}.json`, `https://api.github.com/repos/${upstream.owner}/${upstream.repo}/git/ref/heads/${upstream.ref}`],
      [`ref-tags-${upstream.ref}.json`, `https://api.github.com/repos/${upstream.owner}/${upstream.repo}/git/ref/tags/${upstream.ref}`],
    ]

    for (const [filePath, url] of refEndpoints) {
      try {
        const ref = await fetchJsonCached(filePath, url)
        const sha = ref?.object?.sha
        if (typeof sha === "string" && /^[0-9a-f]{40}$/i.test(sha)) return sha
      } catch (error) {
        if (isNotFound(error)) continue
        throw error
      }
    }

    throw new Error(`Failed to resolve upstream ref ${upstream.ref} to a commit SHA`)
  }

  const fetchText = async (filePath, revision) => {
    const url = `https://raw.githubusercontent.com/${upstream.owner}/${upstream.repo}/${revision}/${filePath}`
    const response = await fetch(url, { headers: { "User-Agent": "opencode-overlay" } })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }

  const fetchTextCached = async (revision, filePath) => {
    const cacheFile = cachePath("raw", revision, filePath)
    const cached = await readCachedText(cacheFile)
    if (cached !== undefined) return cached

    const text = await fetchText(filePath, revision)
    await writeCachedText(cacheFile, text)
    return text
  }

  const writeRefs = async (dir, revision, refs) => {
    await fs.mkdir(dir, { recursive: true })

    await Promise.all(
      [...refs]
        .sort((left, right) => left.refName.localeCompare(right.refName))
        .map(async ({ refName, remotePath }) => {
          const contents = await fetchTextCached(revision, remotePath)
          await fs.writeFile(path.join(dir, `${refName}.ref`), contents)
        }),
    )
  }

  const main = async () => {
    await fs.rm(distDir, { recursive: true, force: true })

    const result = await globalThis.Bun.build({
      entrypoints: [path.join(srcDir, "index.ts")],
      outdir: distDir,
      target: "bun",
      format: "esm",
    })

    if (!result.success) throw new Error("Build failed")

    const commitSha = await resolveCommitSha()
    const commit = await fetchJsonCached(
      `commit-${commitSha}.json`,
      `https://api.github.com/repos/${upstream.owner}/${upstream.repo}/git/commits/${commitSha}`,
    )
    const treeSha = commit.tree.sha
    const tree = await fetchJsonCached(
      `tree-${treeSha}.json`,
      `https://api.github.com/repos/${upstream.owner}/${upstream.repo}/git/trees/${treeSha}?recursive=1`,
    )

    if (tree.truncated) throw new Error("Upstream Git tree listing was truncated")

    await fs.copyFile(path.join(srcDir, "model.txt"), path.join(distDir, "model.txt"))
    await copyTxtFiles(srcDir, distDir, new Set(["model.txt"]))

    await fs.mkdir(path.join(distDir, "_refs"), { recursive: true })
    await fs.writeFile(
      path.join(distDir, "_refs", "source.json"),
      `${JSON.stringify({ owner: upstream.owner, repo: upstream.repo, ref: upstream.ref, commitSha, treeSha }, null, 2)}\n`,
    )

    const modelRefs = remoteTxtPaths(tree.tree, promptDir).map((remotePath) => ({
      refName: path.posix.basename(remotePath, ".txt"),
      remotePath,
    }))
    if (modelRefs.length === 0) throw new Error(`No upstream model prompts found under ${promptDir}`)

    const rootNames = await readTxtNames(srcDir)
    if (rootNames.length === 0) throw new Error(`No root prompt files found in ${srcDir}`)

    const rootPromptNames = rootNames.filter((name) => name !== "model.txt")
    if (rootPromptNames.length === 0) throw new Error(`No root prompt files found in ${srcDir}`)

    const rootRefs = rootPromptNames.map((name) => {
        const stem = path.basename(name, ".txt")
        const remotePath = findRemoteTxt(tree.tree, promptDir, stem)

        if (!remotePath) throw new Error(`Missing upstream prompt for ${name}`)
        return { refName: stem, remotePath }
      })

    const agentNames = await readTxtNames(path.join(srcDir, "agent"))
    if (agentNames.length === 0) throw new Error(`No agent prompt files found in ${path.join(srcDir, "agent")}`)

    const agentRefs = agentNames.map((name) => {
      const stem = path.basename(name, ".txt")
      const remotePath = findRemoteTxt(tree.tree, agentDir, stem)

      if (!remotePath) throw new Error(`Missing upstream agent prompt for ${name}`)
      return { refName: stem, remotePath }
    })

    await Promise.all([
      writeRefs(modelRefDir, commitSha, modelRefs),
      writeRefs(rootRefDir, commitSha, rootRefs),
      writeRefs(agentRefDir, commitSha, agentRefs),
      copyTxtFiles(path.join(srcDir, "tool"), path.join(distDir, "tool")),
      copyTxtFiles(path.join(srcDir, "agent"), path.join(distDir, "agent")),
    ])
  }

  await main()
})().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exit(1)
})
