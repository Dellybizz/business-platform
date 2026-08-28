import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const sourceRoot = path.join(root, "src");

const requiredBoundaries = [
  "apps",
  "core",
  "commerce",
  "website",
  "content",
  "channels",
  "components",
  "themes",
  "plugins",
  "infrastructure",
  "shared",
];

const forbiddenImports = new Map([
  ["core", [/from\s+["'][^"']*\/apps(?:\/|["'])/]],
  ["commerce", [/from\s+["'][^"']*\/apps(?:\/|["'])/]],
  ["website", [/from\s+["'][^"']*\/apps(?:\/|["'])/]],
  ["infrastructure", [/from\s+["'][^"']*\/apps(?:\/|["'])/]],
  ["plugins", [
    /from\s+["'][^"']*(?:\/db|\/infrastructure)(?:\/|["'])/,
    /from\s+["'](?:@\/)?db(?:\/|["'])/,
  ]],
]);

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? filesBelow(target) : [target];
      }),
    )
  ).flat();
}

test("creates every target source boundary", async () => {
  for (const boundary of requiredBoundaries) {
    const target = path.join(sourceRoot, boundary);
    assert.equal((await stat(target)).isDirectory(), true, `${boundary} must be a directory`);
    assert.equal((await stat(path.join(target, "README.md"))).isFile(), true, `${boundary} must document its responsibility`);
  }
});

test("registers all planned application surfaces exactly once", async () => {
  const source = await readFile(path.join(sourceRoot, "apps", "surfaces.ts"), "utf8");
  const expected = [
    "marketing-site",
    "merchant-admin",
    "platform-admin",
    "visual-editor",
    "pos",
    "storefront",
    "portals",
  ];

  for (const id of expected) {
    const occurrences = source.match(new RegExp(`id:\\s*["']${id}["']`, "g")) ?? [];
    assert.equal(occurrences.length, 1, `${id} must have one surface definition`);
  }
});

test("source domains obey dependency direction rules", async () => {
  for (const [boundary, patterns] of forbiddenImports) {
    const files = (await filesBelow(path.join(sourceRoot, boundary))).filter((file) => /\.(?:ts|tsx|mts)$/.test(file));
    for (const file of files) {
      const source = await readFile(file, "utf8");
      for (const pattern of patterns) {
        assert.doesNotMatch(source, pattern, `${path.relative(root, file)} violates the ${boundary} dependency boundary`);
      }
    }
  }
});

test("architecture decisions and migration controls are recorded", async () => {
  const required = [
    "docs/architecture/prototype-inventory.md",
    "docs/architecture/data-migration-strategy.md",
    "docs/architecture/first-vertical-slice.md",
    "docs/architecture/prototype-removal-checklist.md",
    "docs/architecture/smoke-test-matrix.md",
    "docs/operations/development-and-deployment.md",
  ];

  for (const relative of required) {
    const content = await readFile(path.join(root, relative), "utf8");
    assert.ok(content.length > 300, `${relative} must contain a substantive contract`);
  }
});

