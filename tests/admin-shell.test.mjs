import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = (file) => readFile(path.join(root, file), "utf8");

test("admin navigation terminology uses capabilities while service destinations use entitlements", async () => {
  const navigation = await source("src/apps/merchant-admin/navigation.ts");
  assert.match(navigation, /has\(context, "catalog"\)/);
  assert.match(navigation, /has\(context, "services"\)/);
  assert.match(navigation, /context\.type === "cv" \? "Experience" : "Projects"/);
  assert.match(navigation, /hasUsableService\(context\.services, "ecommerce_website"\)/);
  assert.match(navigation, /hasUsableService\(context\.services, "pos"\)/);
  assert.match(navigation, /label: "Sales channels"/);
});

test("CV and portfolio navigation cannot receive commerce channels without service entitlements", async () => {
  const navigation = await source("src/apps/merchant-admin/navigation.ts");
  assert.doesNotMatch(navigation, /context\.type === "cv"[^\n]+Online Store/);
  assert.doesNotMatch(navigation, /context\.type === "portfolio"[^\n]+Point of Sale/);
  assert.match(navigation, /if \(hasUsableService\(context\.services, "ecommerce_website"\)\)/);
  assert.match(navigation, /if \(hasUsableService\(context\.services, "pos"\)\)/);
});

test("plugins register navigation without coupling to AdminShell", async () => {
  const [shell, navigation, plugins] = await Promise.all([
    source("components/platform/admin-shell.tsx"),
    source("src/apps/merchant-admin/navigation.ts"),
    source("src/plugins/admin-navigation.ts"),
  ]);
  assert.match(shell, /buildAdminNavigation/);
  assert.doesNotMatch(shell, /installedPluginNavigation|PluginAdminNavigationItem|`plugin:\$\{/);
  assert.match(navigation, /pluginItems: readonly PluginAdminNavigationItem\[\]/);
  assert.match(navigation, /for \(const item of visiblePlugins\)/);
  assert.match(plugins, /id: `plugin:\$\{string\}`/);
});

test("workspace switcher and global command palette are functional shell controls", async () => {
  const shell = await source("components/platform/admin-shell.tsx");
  assert.match(shell, /method: "PATCH"/);
  assert.match(shell, /workspaceId/);
  assert.match(shell, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(shell, /event\.key\.toLowerCase\(\) === "k"/);
  assert.match(shell, /role="dialog"/);
  assert.match(shell, /admin-bottom-nav/);
});

test("all required settings categories exist and commerce categories are capability-gated", async () => {
  const settings = await source("src/apps/merchant-admin/settings.ts");
  for (const label of ["Business details", "Services", "Users and permissions", "Locations", "Domains", "Payments", "Checkout", "Shipping and delivery", "Taxes", "Notifications", "Files", "Plans and billing", "Custom data", "Apps"]) {
    assert.match(settings, new RegExp(`label: "${label}"`), `${label} is missing`);
  }
  for (const id of ["payments", "checkout", "shipping", "taxes"]) {
    assert.match(settings, new RegExp(`id: "${id}"[^\\n]+requiresAnyCapability`), `${id} must be capability-gated`);
  }
});

test("every new navigation destination exists and uses the shared shell", async () => {
  for (const route of ["analytics", "contacts", "online-store", "pos", "apps"]) {
    const file = `app/${route}/page.tsx`;
    assert.equal((await stat(path.join(root, file))).isFile(), true);
    assert.match(await source(file), /<AdminShell>/);
  }
});

test("dashboard cards use workspace API data and explicit empty states", async () => {
  const dashboard = await source("components/platform/dashboard.tsx");
  assert.match(dashboard, /workspaceData\.summary/);
  assert.match(dashboard, /items\.length/);
  assert.match(dashboard, /No \{contentLabel\.toLowerCase\(\)\} yet/);
  assert.match(dashboard, /Activity will appear after your first/);
});

test("desktop and mobile shell surfaces have responsive styling contracts", async () => {
  const css = await source("app/globals.css");
  for (const selector of [".admin-sidebar", ".admin-mobile-bar", ".admin-bottom-nav", ".admin-command-layer", ".admin-workspace-menu", ".admin-settings-layout"]) assert.match(css, new RegExp(selector.replace(".", "\\.")));
  assert.match(css, /@media\(max-width:1023px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
});
