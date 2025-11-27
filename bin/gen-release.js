#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  readRelease,
  getAllVersions,
  compareSemver,
  releaseToMarkdownFull,
  releaseToMarkdownChangelog
} from "../lib/release-tools.js";

const [, , version, outDirArg] = process.argv;

if (!version) {
  console.error("Usage: release-gen <version> [outDir]");
  process.exit(1);
}

const outDir = outDirArg || "changelog-md";

const current = readRelease(version);

const versions = getAllVersions();
const previousVersions = versions.filter(
  (v) => v !== version && compareSemver(v, version) < 0
);

let md;

if (previousVersions.length === 0) {
  md = releaseToMarkdownFull(current);
  console.log(`No previous version found. Generating FULL release markdown.`);
} else {
  const prevVersion = previousVersions[previousVersions.length - 1];
  const previous = readRelease(prevVersion);
  md = releaseToMarkdownChangelog(current, previous);
  console.log(
    `Generating changelog for ${version} compared to previous ${prevVersion}.`
  );
}

const outPath = path.join(process.cwd(), outDir, `${version}.md`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md, "utf8");

console.log(`Generated release markdown: ${outPath}`);
