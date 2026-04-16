import fs from "node:fs/promises";
import path from "node:path";

export type GitTreeEntry = Readonly<{
  type: string;
  path: string;
}>;

export const readTxtNames = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
    .map((entry) => entry.name)
    .sort();
};

export const copyTxtFiles = async (
  sourceDir: string,
  targetDir: string,
  ignore = new Set<string>(),
): Promise<void> => {
  await fs.mkdir(targetDir, { recursive: true });

  const names = (await fs.readdir(sourceDir))
    .filter((name) => name.endsWith(".txt") && !ignore.has(name))
    .sort();

  await Promise.all(
    names.map((name) =>
      fs.copyFile(path.join(sourceDir, name), path.join(targetDir, name)),
    ),
  );
};

export const remoteTxtPaths = (
  tree: readonly GitTreeEntry[],
  prefix: string,
): string[] => {
  const dirPrefix = `${prefix}/`;

  return tree
    .filter(
      (entry) =>
        entry.type === "blob" &&
        entry.path.startsWith(dirPrefix) &&
        entry.path.endsWith(".txt"),
    )
    .map((entry) => entry.path)
    .sort();
};

export const findRemoteTxt = (
  tree: readonly GitTreeEntry[],
  prefix: string,
  stem: string,
): string | undefined => {
  const dirPrefix = `${prefix}/`;
  const exact = `${dirPrefix}${stem}.txt`;
  const suffix = `/${stem}.txt`;

  const matches = tree
    .filter(
      (entry) =>
        entry.type === "blob" &&
        entry.path.startsWith(dirPrefix) &&
        entry.path.endsWith(suffix),
    )
    .map((entry) => entry.path)
    .sort(
      (left, right) => left.length - right.length || left.localeCompare(right),
    );

  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];
  if (matches.includes(exact)) return exact;

  throw new Error(
    `Ambiguous upstream prompt match for ${prefix}/${stem}.txt: ${matches.join(", ")}`,
  );
};
