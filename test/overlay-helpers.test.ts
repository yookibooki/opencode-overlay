import { expect, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  loadModelPairs,
  loadPrefixPairs,
  loadTools,
  rewriteByPrefix,
  rewriteStringsInPlace,
} from "../src/overlay-helpers.ts";

const tempDir = async () =>
  fs.mkdtemp(path.join(os.tmpdir(), "opencode-overlay-"));

test("loadPrefixPairs rejects missing directories", async () => {
  const base = await tempDir();
  const missing = path.join(base, "missing");

  await expect(loadPrefixPairs(missing, missing)).rejects.toThrow();
});

test("loadPrefixPairs rejects empty directories", async () => {
  const base = await tempDir();
  const sourceDir = path.join(base, "source");
  const overrideDir = path.join(base, "override");
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(overrideDir, { recursive: true });

  await expect(loadPrefixPairs(sourceDir, overrideDir)).rejects.toThrow(
    /No \.ref files/,
  );
});

test("loadTools rejects missing directory", async () => {
  const base = await tempDir();
  const missing = path.join(base, "missing");

  await expect(loadTools(missing)).rejects.toThrow();
});

test("loadTools rejects duplicate normalized ids", async () => {
  const base = await tempDir();
  await fs.mkdir(base, { recursive: true });

  await fs.writeFile(path.join(base, "ls.txt"), "list");
  await fs.writeFile(path.join(base, "list.txt"), "custom list");

  await expect(loadTools(base)).rejects.toThrow(/Duplicate tool override/);
});

test("loadModelPairs rejects missing directory", async () => {
  const base = await tempDir();
  const missing = path.join(base, "missing");

  await expect(loadModelPairs(missing, "override")).rejects.toThrow();
});

test("loadPrefixPairs reads exact prefix pairs", async () => {
  const base = await tempDir();
  const sourceDir = path.join(base, "source");
  const overrideDir = path.join(base, "override");
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(overrideDir, { recursive: true });

  await fs.writeFile(path.join(sourceDir, "alpha.ref"), "builtin alpha");
  await fs.writeFile(path.join(overrideDir, "alpha.txt"), "override alpha");

  const pairs = await loadPrefixPairs(sourceDir, overrideDir);
  expect(pairs).toEqual([
    { builtin: "builtin alpha", override: "override alpha" },
  ]);
});

test("rewriteByPrefix rewrites matching prefixes", () => {
  expect(
    rewriteByPrefix("hello world", [{ builtin: "hello", override: "hi" }]),
  ).toBe("hi world");
});

test("rewriteStringsInPlace rewrites each string", () => {
  const strings = ["hello world", "unchanged"];
  rewriteStringsInPlace(strings, [{ builtin: "hello", override: "hi" }]);

  expect(strings).toEqual(["hi world", "unchanged"]);
});
