#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  readRelease,
  diffReleases,
  diffToMarkdown
} from "../lib/release-tools.js";

const [, , fromVersion, toVersion, outDirArg] = process.argv;

if (!fromVersion || !toVersion) {
  console.error("Usage: release-migration <fromVersion> <toVersion> [outDir]");
  process.exit(1);
}

const outDir = outDirArg || path.join("changelog-md", "migrations");

const fromRelease = readRelease(fromVersion);
const toRelease = readRelease(toVersion);

const diff = diffReleases(fromRelease, toRelease);
const md = diffToMarkdown(diff);

const fileName = `${fromVersion}-to-${toVersion}.md`;
const outPath = path.join(process.cwd(), outDir, fileName);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md, "utf8");

console.log(`Generated migration markdown: ${outPath}`);
