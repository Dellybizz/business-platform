import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  capabilitiesForServices,
  defaultServicesForWorkspaceType,
  hasUsableService,
  serviceCatalog,
  serviceProducts,
} from "../src/core/entitlements/model.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = (file) => readFile(path.join(root, file), "utf8");

const entitlement = (service, status = "active") => ({
  service, status, activatedAt: 1, trialEndsAt: null, suspendedAt: null, cancelledAt: null, updatedAt: 1,
});

test("service catalogue contains every separately activatable product", () => {
  assert.deepEqual(serviceProducts, ["ecommerce_website", "pos", "business_showcase", "cv", "portfolio"]);
  assert.deepEqual(serviceCatalog.ecommerce_website.capabilities, ["website", "catalog", "checkout"]);
  assert.deepEqual(serviceCatalog.pos.capabilities, ["catalog", "pos"]);
  assert.deepEqual(defaultServicesForWorkspaceType("commerce_business"), []);
  assert.deepEqual(defaultServicesForWorkspaceType("cv"), ["cv"]);
});

test("website-only, POS-only and combined services derive independent capabilities", () => {
  assert.deepEqual(capabilitiesForServices(["ecommerce_website"]), ["website", "catalog", "checkout"]);
  assert.deepEqual(capabilitiesForServices(["pos"]), ["catalog", "pos"]);
  assert.deepEqual(capabilitiesForServices(["ecommerce_website", "pos"]), ["website", "catalog", "checkout", "pos"]);
});

test("only active and unexpired trial entitlements are usable", () => {
  assert.equal(hasUsableService([entitlement("pos")], "pos"), true);
  assert.equal(hasUsableService([entitlement("pos", "suspended")], "pos"), false);
  assert.equal(hasUsableService([{ ...entitlement("pos", "trial"), trialEndsAt: Date.now() - 1 }], "pos"), false);
});

test("commerce onboarding requires explicit Website or POS selection", async () => {
  const [onboarding, page, route] = await Promise.all([
    source("src/core/workspaces/onboarding.ts"), source("app/page.tsx"), source("app/api/workspace/route.ts"),
  ]);
  assert.match(onboarding, /Choose at least one service to activate/);
  assert.match(page, /Nothing is activated automatically/);
  assert.match(page, /services: selected === "commerce_business" \? selectedServices/);
  assert.match(route, /workspace_service_entitlements/);
  assert.match(route, /capabilitiesForServices\(input\.services\)/);
});

test("legacy migration preserves channel intent and non-commerce services", async () => {
  const migration = await source("drizzle/0009_empty_unicorn.sql");
  assert.match(migration, /'ecommerce_website'/);
  assert.match(migration, /c\.capability = 'website'/);
  assert.match(migration, /'pos'/);
  assert.match(migration, /c\.capability = 'pos'/);
  for (const service of ["business_showcase", "cv", "portfolio"]) assert.match(migration, new RegExp(`'${service}'`));
  assert.doesNotMatch(migration, /DELETE FROM (content_items|pages|workspace_capabilities)/);
});

test("legacy migration executes and backfills Website-only, POS-only, combined and personal tenants", async () => {
  const migration = await source("drizzle/0009_empty_unicorn.sql");
  const script = `
import json, sqlite3, sys
payload=json.load(sys.stdin); db=sqlite3.connect(':memory:')
db.executescript("""
CREATE TABLE workspaces(id TEXT PRIMARY KEY, workspace_type TEXT, created_at INTEGER, updated_at INTEGER);
CREATE TABLE workspace_capabilities(workspace_id TEXT, capability TEXT, enabled_at INTEGER);
CREATE TABLE role_permissions(role_id TEXT, permission TEXT, UNIQUE(role_id,permission));
INSERT INTO workspaces VALUES ('web','commerce_business',1,2),('pos','commerce_business',1,2),('both','commerce_business',1,2),('cv','cv',1,2);
INSERT INTO workspace_capabilities VALUES ('web','website',1),('pos','pos',1),('both','website',1),('both','pos',1),('cv','website',1);
""")
db.executescript(payload['migration'].replace('--> statement-breakpoint',''))
print(json.dumps(db.execute('SELECT workspace_id,service,status FROM workspace_service_entitlements ORDER BY workspace_id,service').fetchall()))
`;
  const result = spawnSync("python3", ["-c", script], { input: JSON.stringify({ migration }), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), [
    ["both", "ecommerce_website", "active"], ["both", "pos", "active"], ["cv", "cv", "active"],
    ["pos", "pos", "active"], ["web", "ecommerce_website", "active"],
  ]);
});

test("navigation and billing settings reflect explicit services", async () => {
  const [navigation, settings, shell] = await Promise.all([
    source("src/apps/merchant-admin/navigation.ts"), source("src/apps/merchant-admin/settings.ts"), source("components/platform/admin-shell.tsx"),
  ]);
  assert.match(navigation, /hasUsableService\(context\.services, "ecommerce_website"\)/);
  assert.match(navigation, /hasUsableService\(context\.services, "pos"\)/);
  assert.match(settings, /id: "services"/);
  assert.match(settings, /id: "billing"/);
  assert.match(shell, /data\.workspace\?\.services/);
});

test("entitlement enforcement is centralized and applied to service surfaces", async () => {
  const [service, onlineStore, pos, pages, items, publicRoute] = await Promise.all([
    source("src/core/entitlements/service.ts"), source("app/online-store/page.tsx"), source("app/pos/page.tsx"),
    source("app/api/pages/route.ts"), source("app/api/items/route.ts"), source("app/api/public/[slug]/route.ts"),
  ]);
  assert.match(service, /requireServiceEntitlement/);
  assert.match(service, /requireAnyServiceEntitlement/);
  assert.match(service, /status: 403/);
  assert.match(onlineStore, /requireServiceEntitlement\(await requireTenant\(\), "ecommerce_website"\)/);
  assert.match(pos, /requireServiceEntitlement\(await requireTenant\(\), "pos"\)/);
  assert.match(pages, /requireAnyServiceEntitlement/);
  assert.match(items, /requireAnyServiceEntitlement/);
  assert.match(publicRoute, /workspace_service_entitlements/);
});

test("combined overview and dedicated dashboards are present", async () => {
  const dashboard = await source("components/platform/dashboard.tsx");
  assert.match(dashboard, /Combined business overview/);
  assert.match(dashboard, /Website and POS share one commerce core/);
  assert.equal(serviceCatalog.ecommerce_website.dashboardHref, "/online-store");
  assert.equal(serviceCatalog.pos.dashboardHref, "/pos");
});
