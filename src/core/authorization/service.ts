import { env } from "cloudflare:workers";
import { requireTenant, type TenantContext } from "@/lib/auth/tenant";
import type { PlatformPermission, StaffPermission } from "./permissions";

export async function requirePermission(context: TenantContext, permission: StaffPermission) {
  const allowed = await env.DB.prepare(
    "SELECT 1 AS allowed FROM role_permissions WHERE role_id = ? AND permission = ?",
  ).bind(context.role, permission).first<{ allowed: number }>();
  if (!allowed) throw new Response("Forbidden", { status: 403 });
  return context;
}

export async function authorize(permission: StaffPermission) {
  return requirePermission(await requireTenant(), permission);
}

export async function requirePlatformPermission(userId: string, permission: PlatformPermission) {
  const allowed = await env.DB.prepare(
    `SELECT 1 AS allowed
     FROM platform_memberships pm
     JOIN role_permissions rp ON rp.role_id = pm.role
     WHERE pm.user_id = ? AND rp.permission = ?`,
  ).bind(userId, permission).first<{ allowed: number }>();
  if (!allowed) throw new Response("Forbidden", { status: 403 });
  return { userId, permission };
}
