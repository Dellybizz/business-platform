import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const temporaryRoutes = [
  ["marketing-site", "app/page.tsx"],
  ["merchant-admin", "app/dashboard/page.tsx"],
  ["merchant-admin", "app/site/page.tsx"],
  ["website", "app/pages/page.tsx"],
  ["visual-editor", "app/builder/page.tsx"],
  ["theme-engine", "app/themes/page.tsx"],
  ["storefront", "app/s/[slug]/page.tsx"],
  ["storefront", "app/s/[slug]/[page]/page.tsx"],
];

test("critical prototype routes remain available until vertical-slice cutover", async () => {
  for (const [owner, relative] of temporaryRoutes) {
    const route = path.join(root, relative);
    assert.equal((await stat(route)).isFile(), true, `${relative} temporarily owned by ${owner} is missing`);
  }
});

test("temporary routes have a documented removal condition", async () => {
  const inventory = await readFile(path.join(root, "docs/architecture/prototype-inventory.md"), "utf8");
  for (const [, relative] of temporaryRoutes) {
    assert.ok(
      inventory.includes(`\`${relative}\``),
      `${relative} must be classified in the prototype inventory`,
    );
  }
});

test("every planned application surface is represented in the smoke matrix", async () => {
  const [surfaces, matrix] = await Promise.all([
    readFile(path.join(root, "src/apps/surfaces.ts"), "utf8"),
    readFile(path.join(root, "docs/architecture/smoke-test-matrix.md"), "utf8"),
  ]);
  for (const id of ["marketing-site", "merchant-admin", "platform-admin", "visual-editor", "pos", "storefront", "portals"]) {
    assert.match(surfaces, new RegExp(`["']${id}["']`));
    const label = id
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" ");
    assert.match(matrix.toLowerCase(), new RegExp(label.toLowerCase().replace("-", "[- ]")));
  }
});
