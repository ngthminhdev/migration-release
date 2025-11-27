import fs from "node:fs";
import path from "node:path";

export function readRelease(version, releasesDir = "releases") {
  const filePath = path.join(process.cwd(), releasesDir, `${version}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

/** So sánh semver đơn giản x.y.z */
export function compareSemver(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

/** Generate tags based on release content */
export function generateReleaseTags(release) {
  const tags = ["release"];
  
  if (release.tags && Array.isArray(release.tags)) {
    // If release JSON already has tags, use them
    tags.push(...release.tags);
  } else {
    // Auto-generate tags based on content
    if (release.features?.length) {
      tags.push("feature");
    }
    if (release.bugfixes?.length) {
      tags.push("bugfix");
    }
    if (release.improvements?.length) {
      tags.push("improvement");
    }
    if (release.security?.length) {
      tags.push("security");
    }
    if (release.breakingChanges?.length) {
      tags.push("breaking-change");
    }
    if (release.deprecated?.length) {
      tags.push("deprecated");
    }
  }
  
  // Remove duplicates and return
  return [...new Set(tags)];
}

export function getAllVersions(releasesDir = "releases") {
  const dir = path.join(process.cwd(), releasesDir);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  const versions = files.map((f) => f.replace(".json", ""));
  versions.sort(compareSemver);
  return versions;
}

export function diffReleases(fromRelease, toRelease) {
  const result = {
    versionFrom: fromRelease.version,
    versionTo: toRelease.version,
    runtimeChanges: {},
    envAdded: [],
    envRemoved: [],
    envChanged: [],
    newScripts: [],
  };

  // Runtime
  if (fromRelease.runtime?.node !== toRelease.runtime?.node) {
    result.runtimeChanges.node = {
      from: fromRelease.runtime?.node || null,
      to: toRelease.runtime?.node || null,
    };
  }

  // Env
  const fromEnvMap = Object.fromEntries(
    (fromRelease.env || []).map((e) => [e.key, e]),
  );
  const toEnvMap = Object.fromEntries(
    (toRelease.env || []).map((e) => [e.key, e]),
  );

  for (const [key, toEnv] of Object.entries(toEnvMap)) {
    const fromEnv = fromEnvMap[key];
    if (!fromEnv) {
      result.envAdded.push(toEnv);
    } else {
      const changedFields = {};
      if (fromEnv.default !== toEnv.default) {
        changedFields.default = { from: fromEnv.default, to: toEnv.default };
      }
      if (fromEnv.required !== toEnv.required) {
        changedFields.required = { from: fromEnv.required, to: toEnv.required };
      }
      if (fromEnv.description !== toEnv.description) {
        changedFields.description = {
          from: fromEnv.description,
          to: toEnv.description,
        };
      }
      if (Object.keys(changedFields).length > 0) {
        result.envChanged.push({ key, changes: changedFields });
      }
    }
  }

  for (const key of Object.keys(fromEnvMap)) {
    if (!toEnvMap[key]) {
      result.envRemoved.push(fromEnvMap[key]);
    }
  }

  const fromScriptIds = new Set((fromRelease.scripts || []).map((s) => s.id));
  result.newScripts = (toRelease.scripts || []).filter(
    (s) => !fromScriptIds.has(s.id),
  );

  return result;
}

/** Dùng cho MIGRATION markdown (giữ nguyên) */
export function diffToMarkdown(diff) {
  const lines = [];
  lines.push(`---`);
  lines.push(`title: "Upgrade ${diff.versionFrom} → ${diff.versionTo}"`);
  lines.push(`tags: ["migration"]`);
  lines.push(`---`);
  lines.push("");
  lines.push(
    `Upgrade guide from \`${diff.versionFrom}\` to \`${diff.versionTo}\`.`,
  );
  lines.push("");

  if (diff.runtimeChanges.node) {
    lines.push("## Runtime");
    lines.push("");
    lines.push(
      `- NodeJS: \`${diff.runtimeChanges.node.from}\` → \`${diff.runtimeChanges.node.to}\``,
    );
    lines.push("");
  }

  if (diff.envAdded.length) {
    lines.push("## New Environment Variables");
    lines.push("");
    for (const e of diff.envAdded) {
      lines.push(
        `- \`${e.key}\`${e.required ? " (required)" : ""} – default: \`${e.default}\` – ${e.description}`,
      );
    }
    lines.push("");
  }

  if (diff.envChanged.length) {
    lines.push("## Changed Environment Variables");
    lines.push("");
    for (const e of diff.envChanged) {
      const { key, changes } = e;
      const changeParts = [];
      if (changes.default) {
        changeParts.push(
          `default: \`${changes.default.from}\` → \`${changes.default.to}\``,
        );
      }
      if (changes.required) {
        changeParts.push(
          `required: \`${changes.required.from}\` → \`${changes.required.to}\``,
        );
      }
      if (changes.description) {
        changeParts.push("description updated");
      }
      lines.push(`- \`${key}\` (${changeParts.join(", ")})`);
    }
    lines.push("");
  }

  if (diff.envRemoved.length) {
    lines.push("## Removed Environment Variables");
    lines.push("");
    for (const e of diff.envRemoved) {
      lines.push(`- \`${e.key}\``);
    }
    lines.push("");
  }

  if (diff.newScripts.length) {
    lines.push("## Scripts / Migration steps");
    lines.push("");
    for (const s of diff.newScripts) {
      lines.push(`### ${s.title}`);
      lines.push("");
      for (const step of s.steps || []) {
        lines.push(`- ${step}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/** ❶ FULL: dùng cho release đầu tiên (show đủ env) */
export function releaseToMarkdownFull(release) {
  const lines = [];
  const tags = generateReleaseTags(release);

  lines.push(`---`);
  lines.push(`title: "v${release.version}"`);
  lines.push(`date: "${release.date}"`);
  lines.push(`tags: ${JSON.stringify(tags)}`);
  lines.push(`---`);
  lines.push("");
  lines.push(`## Release Information`);
  lines.push("");
  lines.push(`- **Version**: \`${release.version}\``);
  lines.push(`- **Node**: \`${release.runtime?.node || "N/A"}\``);
  lines.push("");

  if (release.features?.length) {
    lines.push("## Features");
    lines.push("");
    for (const f of release.features) {
      lines.push(`- ${f}`);
    }
    lines.push("");
  }

  if (release.bugfixes?.length) {
    lines.push("## Bug Fixes");
    lines.push("");
    for (const b of release.bugfixes) {
      lines.push(`- ${b}`);
    }
    lines.push("");
  }

  if (release.improvements?.length) {
    lines.push("## Improvements");
    lines.push("");
    for (const i of release.improvements) {
      lines.push(`- ${i}`);
    }
    lines.push("");
  }

  if (release.security?.length) {
    lines.push("## Security");
    lines.push("");
    for (const s of release.security) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  if (release.env?.length) {
    lines.push("## Environment Variables (complete list)");
    lines.push("");
    for (const e of release.env) {
      lines.push(
        `- \`${e.key}\`${e.required ? " (required)" : ""} – default: \`${e.default}\` – ${e.description}`,
      );
    }
    lines.push("");
  }

  if (release.scripts?.length) {
    lines.push("## Scripts / Migration steps");
    lines.push("");
    for (const s of release.scripts) {
      lines.push(`### ${s.title}`);
      lines.push("");
      for (const step of s.steps || []) {
        lines.push(`- ${step}`);
      }
      lines.push("");
    }
  }

  if (release.breakingChanges?.length) {
    lines.push("## Breaking changes");
    lines.push("");
    for (const b of release.breakingChanges) {
      lines.push(`- ${b}`);
    }
  }

  return lines.join("\n");
}

/** ❷ CHANGELOG: chỉ show phần thay đổi so với bản trước */
export function releaseToMarkdownChangelog(current, previous) {
  const diff = diffReleases(previous, current);
  const lines = [];
  const tags = generateReleaseTags(current);

  lines.push(`---`);
  lines.push(`title: "v${current.version}"`);
  lines.push(`date: "${current.date}"`);
  lines.push(`tags: ${JSON.stringify(tags)}`);
  lines.push(`---`);
  lines.push("");
  lines.push(
    `Changelog for \`${current.version}\` (compared to previous version \`${previous.version}\`).`,
  );
  lines.push("");
  lines.push(`- **Version**: \`${current.version}\``);
  lines.push(`- **Node**: \`${current.runtime?.node || "N/A"}\``);
  lines.push("");

  if (current.features?.length) {
    lines.push("## New Features");
    lines.push("");
    for (const f of current.features) {
      lines.push(`- ${f}`);
    }
    lines.push("");
  }

  if (current.bugfixes?.length) {
    lines.push("## Bug Fixes");
    lines.push("");
    for (const b of current.bugfixes) {
      lines.push(`- ${b}`);
    }
    lines.push("");
  }

  if (current.improvements?.length) {
    lines.push("## Improvements");
    lines.push("");
    for (const i of current.improvements) {
      lines.push(`- ${i}`);
    }
    lines.push("");
  }

  if (current.security?.length) {
    lines.push("## Security");
    lines.push("");
    for (const s of current.security) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  if (diff.runtimeChanges.node) {
    lines.push("## Runtime");
    lines.push("");
    lines.push(
      `- NodeJS: \`${diff.runtimeChanges.node.from}\` → \`${diff.runtimeChanges.node.to}\``,
    );
    lines.push("");
  }

  if (
    diff.envAdded.length ||
    diff.envChanged.length ||
    diff.envRemoved.length
  ) {
    lines.push("## Environment Variables Changes");
    lines.push("");

    if (diff.envAdded.length) {
      lines.push("### Added Environment Variables");
      for (const e of diff.envAdded) {
        lines.push(
          `- \`${e.key}\`${e.required ? " (required)" : ""} – default: \`${e.default}\` – ${e.description}`,
        );
      }
      lines.push("");
    }

    if (diff.envChanged.length) {
      lines.push("### Modified Environment Variables");
      for (const e of diff.envChanged) {
        const { key, changes } = e;
        const parts = [];
        if (changes.default) {
          parts.push(
            `default: \`${changes.default.from}\` → \`${changes.default.to}\``,
          );
        }
        if (changes.required) {
          parts.push(
            `required: \`${changes.required.from}\` → \`${changes.required.to}\``,
          );
        }
        if (changes.description) {
          parts.push(`description updated`);
        }
        lines.push(`- \`${key}\` (${parts.join(", ")})`);
      }
      lines.push("");
    }

    if (diff.envRemoved.length) {
      lines.push("### Removed Environment Variables");
      for (const e of diff.envRemoved) {
        lines.push(`- \`${e.key}\``);
      }
      lines.push("");
    }
  }

  if (diff.newScripts.length) {
    lines.push("## New Scripts / Migration steps (compared to previous version)");
    lines.push("");
    for (const s of diff.newScripts) {
      lines.push(`### ${s.title}`);
      lines.push("");
      for (const step of s.steps || []) {
        lines.push(`- ${step}`);
      }
      lines.push("");
    }
  }

  if (current.breakingChanges?.length) {
    lines.push("## Breaking changes");
    lines.push("");
    for (const b of current.breakingChanges) {
      lines.push(`- ${b}`);
    }
  }

  return lines.join("\n");
}
