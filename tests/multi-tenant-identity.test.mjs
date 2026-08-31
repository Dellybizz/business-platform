import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = (file) => readFile(path.join(root, file), "utf8");

test("tenant repositories scope reads and object mutations to the active workspace", async () => {
  const contracts = [
    ["app/api/items/route.ts", /WHERE workspace_id = \?/, /WHERE id = \? AND workspace_id = \?/],
    ["app/api/submissions/route.ts", /WHERE workspace_id = \?/, /WHERE id = \? AND workspace_id = \?/],
    ["app/api/members/route.ts", /WHERE m\.workspace_id = \?/, /WHERE id = \? AND workspace_id = \?/],
  ];
  for (const [file, ...patterns] of contracts) {
    const body = await source(file);
    for (const pattern of patterns) assert.match(body, pattern, `${file} must enforce ${pattern}`);
  }
  const pageRoute = await source("app/api/pages/route.ts");
  const websiteService = await source("src/website/service.ts");
  assert.match(pageRoute, /listPages\(env\.DB, context\.workspace\.id\)/);
  assert.match(pageRoute, /workspace: context\.workspace/);
  assert.match(websiteService, /JOIN sites s ON s\.id=p\.site_id WHERE s\.workspace_id=\?/);
  assert.match(websiteService, /WHERE p\.id=\? AND s\.workspace_id=\?/);
  assert.match(await source("lib/auth/tenant.ts"), /WHERE m\.user_id = \?/);
  assert.match(await source("lib/auth/tenant.ts"), /WHERE workspace_id = \? AND user_id = \?/);
});

test("every protected mutation performs server-side authorization", async () => {
  const protectedRoutes = [
    "app/api/items/route.ts",
    "app/api/pages/route.ts",
    "app/api/submissions/route.ts",
    "app/api/members/route.ts",
    "app/api/staff-pin/route.ts",
    "app/api/workspace/route.ts",
  ];
  for (const file of protectedRoutes) {
    const body = await source(file);
    assert.match(body, /authorize\(|authorizeWebsite\(|requirePermission\(|ensureUser\(/, `${file} must authorize on the server`);
  }
  const service = await source("src/core/authorization/service.ts");
  const websiteAuthorization = await source("src/website/authorization.ts");
  assert.match(service, /role_permissions/);
  assert.match(service, /throw new Response\("Forbidden", \{ status: 403 \}\)/);
  assert.match(websiteAuthorization, /authorize\(permission\)/);
  assert.match(websiteAuthorization, /requireAnyServiceEntitlement/);
});

test("staff and plugin permissions use separate namespaces and persistence", async () => {
  const permissions = await source("src/core/authorization/permissions.ts");
  assert.match(permissions, /export const staffPermissions/);
  assert.match(permissions, /export const platformPermissions/);
  assert.match(permissions, /export const pluginPermissionScopes/);
  const staffList = permissions.slice(
    permissions.indexOf("export const staffPermissions"),
    permissions.indexOf("export type StaffPermission"),
  );
  assert.doesNotMatch(staffList, /catalog:read/);
  const migration = await source("drizzle/0007_certain_wildside.sql");
  const platformMigration = await source("drizzle/0008_lethal_madame_hydra.sql");
  for (const role of ["owner", "administrator", "website_editor", "store_manager", "pos_manager", "pos_staff", "support_viewer"]) {
    assert.match(migration, new RegExp(`\\('${role}'`), `${role} must be seeded`);
  }
  assert.match(migration, /plugin_permission_scopes/);
  assert.match(platformMigration, /platform_memberships/);
  assert.match(migration, /'platform_owner', 'Platform owner', 'platform'/);
  assert.match(migration, /memberships_user_workspace_unique/);
});

test("authentication uses hardened password hashes, revocable sessions, and recovery tokens", async () => {
  const crypto = await source("src/core/identity/crypto.ts");
  const session = await source("src/core/identity/session.ts");
  const recovery = await source("app/api/auth/recover/route.ts");
  assert.match(crypto, /PBKDF2/);
  assert.match(crypto, /MAX_SUPPORTED_PBKDF2_ITERATIONS = 100_000/);
  assert.match(crypto, /PASSWORD_ITERATIONS = MAX_SUPPORTED_PBKDF2_ITERATIONS/);
  assert.match(crypto, /iterations:\s*PASSWORD_ITERATIONS/);
  assert.match(crypto, /iterations > MAX_SUPPORTED_PBKDF2_ITERATIONS/);
  assert.match(session, /httpOnly:\s*true/);
  assert.match(session, /secure:\s*true/);
  assert.match(session, /revoked_at IS NULL/);
  assert.match(recovery, /account_recovery_tokens/);
  assert.match(recovery, /revokeAllUserSessions/);
});

test("Google authentication validates OAuth state, uses PKCE, and accepts only verified emails", async () => {
  const start = await source("app/api/auth/google/route.ts");
  const callback = await source("app/api/auth/google/callback/route.ts");
  const provider = await source("src/core/identity/google-oauth.ts");
  const worker = await source("worker/index.ts");
  const login = await source("app/login/page.tsx");
  assert.match(start, /modulo_google_state/);
  assert.match(start, /httpOnly:\s*true/);
  assert.match(callback, /constantTimeEqual\(state, expectedState\)/);
  assert.match(callback, /createSession\(user\.id\)/);
  assert.match(provider, /code_challenge_method:\s*"S256"/);
  assert.match(provider, /profile\.email_verified !== true/);
  assert.match(provider, /process\.env\.GOOGLE_CLIENT_ID/);
  assert.match(provider, /requestRuntime\?\.GOOGLE_CLIENT_ID/);
  assert.match(worker, /env\.GOOGLE_CLIENT_ID/);
  assert.match(worker, /__MODULO_RUNTIME_ENV__/);
  assert.match(login, /Continue with Google/);
});

test("staff management and sensitive workspace mutations write audit events", async () => {
  for (const file of [
    "app/api/members/route.ts",
    "app/api/staff-pin/route.ts",
    "app/api/items/route.ts",
    "app/api/submissions/route.ts",
    "app/api/workspace/route.ts",
  ]) {
    assert.match(await source(file), /writeAuditEvent\(/, `${file} must create audit events`);
  }
  const members = await source("app/api/members/route.ts");
  assert.match(members, /members\.invite/);
  assert.match(members, /members\.manage/);
  assert.match(members, /target\.role === "owner"/);
});
