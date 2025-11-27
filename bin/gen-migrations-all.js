#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  readRelease,
  getAllVersions,
  diffReleases,
  diffToMarkdown
} from "../lib/release-tools.js";

const [, , outDirArg] = process.argv;
const outDir = outDirArg || path.join("changelog-md", "migrations");

function generateAll() {
  const versions = getAllVersions();
  console.log("Found versions:", versions.join(", "));

  fs.mkdirSync(path.join(process.cwd(), outDir), { recursive: true });

  for (let i = 0; i < versions.length; i++) {
    for (let j = i + 1; j < versions.length; j++) {
      const fromVersion = versions[i];
      const toVersion = versions[j];

      const fromRelease = readRelease(fromVersion);
      const toRelease = readRelease(toVersion);

      const diff = diffReleases(fromRelease, toRelease);
      const md = diffToMarkdown(diff);

      const fileName = `${fromVersion}-to-${toVersion}.md`;
      const outPath = path.join(process.cwd(), outDir, fileName);

      fs.writeFileSync(outPath, md, "utf8");
      console.log(`Generated migration: ${outPath}`);
    }
  }

  console.log("✅ Done generating all migrations.");
}

generateAll();
