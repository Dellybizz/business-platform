import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  capabilities,
  workspacePresets,
  workspaceTypes,
} from "../src/core/workspaces/model.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

const validInput = {
  commerce_business: { name: "North & Pine", slug: "north-pine", businessCategory: "Retail" },
  business_showcase: { name: "Aster Studio", slug: "aster-studio", businessCategory: "Architecture" },
  cv: { name: "Asha Mehta", slug: "asha-mehta" },
  portfolio: { name: "Asha Creates", slug: "asha-creates" },
};

test("defines exactly four independently creatable workspace types", () => {
  assert.deepEqual(workspaceTypes, ["commerce_business", "business_showcase", "cv", "portfolio"]);
  for (const type of workspaceTypes) {
    assert.ok(validInput[type].name);
    assert.ok(workspacePresets[type].capabilities.includes("website"));
    assert.ok(workspacePresets[type].starterPages.some((page) => page.slug === "home"));
    assert.equal(new Set(workspacePresets[type].starterPages.map((page) => page.slug)).size, workspacePresets[type].starterPages.length);
  }
});

test("assigns appropriate default modules to each type", () => {
  assert.deepEqual(workspacePresets.commerce_business.capabilities, ["website", "catalog", "checkout", "pos"]);
  assert.deepEqual(workspacePresets.business_showcase.capabilities, ["website", "services", "bookings", "blog"]);
  assert.deepEqual(workspacePresets.cv.capabilities, ["website", "portfolio"]);
  assert.deepEqual(workspacePresets.portfolio.capabilities, ["website", "portfolio", "blog"]);
  for (const preset of Object.values(workspacePresets)) {
    for (const capability of preset.capabilities) assert.ok(capabilities.includes(capability));
  }
});

test("requires a business category only for business workspace types", () => {
  assert.equal(workspacePresets.commerce_business.requiresBusinessCategory, true);
  assert.equal(workspacePresets.business_showcase.requiresBusinessCategory, true);
  assert.equal(workspacePresets.cv.requiresBusinessCategory, false);
  assert.equal(workspacePresets.portfolio.requiresBusinessCategory, false);
});

test("validates slugs and creates stable idempotency keys before persistence", async () => {
  const source = await readFile(path.join(root, "src/core/workspaces/onboarding.ts"), "utf8");
  assert.match(source, /normalizeWorkspaceSlug/);
  assert.match(source, /slug\.length < 3/);
  assert.match(source, /requiresBusinessCategory/);
  assert.match(source, /return `\$\{userId\}:\$\{input\.requestId \?\?/);
});

test("public onboarding exposes all types and redirects through the API response", async () => {
  const page = await readFile(path.join(root, "app/page.tsx"), "utf8");
  for (const type of workspaceTypes) assert.match(page, new RegExp(`id:\\s*["']${type}["']`));
  assert.match(page, /window\.location\.assign\(data\.dashboardUrl/);
});

test("workspace persistence is idempotent and capabilities are additive", async () => {
  const [route, migration] = await Promise.all([
    readFile(path.join(root, "app/api/workspace/route.ts"), "utf8"),
    readFile(path.join(root, "drizzle/0006_salty_dragon_man.sql"), "utf8"),
  ]);
  assert.match(route, /WHERE w\.onboarding_key = \? AND m\.user_id = \?/);
  assert.match(route, /idempotent:\s*true/);
  assert.match(route, /INSERT OR IGNORE INTO workspace_capabilities/);
  assert.doesNotMatch(route, /DELETE FROM workspace_capabilities/);
  assert.match(migration, /CREATE UNIQUE INDEX `workspaces_onboarding_key_unique`/);
  assert.match(migration, /workspace_capabilities_workspace_capability_unique/);
});
