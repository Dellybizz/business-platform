import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { requireSessionUser } from "@/src/core/identity/session";
import { isCapability, isWorkspaceType, type Capability, type WorkspaceType } from "@/src/core/workspaces/model";
import { listServiceEntitlements } from "@/src/core/entitlements/service";
import type { ServiceEntitlement } from "@/src/core/entitlements/model";

export type TenantContext = {
  user: { id: string; email: string; displayName: string };
  workspace: {
    id: string;
    name: string;
    type: WorkspaceType;
    businessCategory: string | null;
    capabilities: Capability[];
    services: ServiceEntitlement[];
    slug: string;
    themeId: string;
  };
  role: string;
};

const ACTIVE_WORKSPACE_COOKIE = "modulo_workspace";

type MembershipRow = {
  workspaceId: string;
  role: string;
  name: string;
  workspaceType: string;
  businessCategory: string | null;
  slug: string | null;
  themeId: string;
};

export async function ensureUser() {
  return requireSessionUser();
}

const membershipQuery = `
  SELECT m.workspace_id AS workspaceId, m.role, w.name,
    w.workspace_type AS workspaceType,
    w.business_category AS businessCategory,
    w.slug, w.theme_id AS themeId
  FROM memberships m
  JOIN workspaces w ON w.id = m.workspace_id
  WHERE m.user_id = ?
  ORDER BY m.created_at
`;

export async function requireTenant(): Promise<TenantContext> {
  const user = await ensureUser();
  const memberships = await env.DB.prepare(membershipQuery).bind(user.id).all<MembershipRow>();
  if (!memberships.results.length) throw new Response("Create a workspace first", { status: 409 });

  const selected = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const membership = memberships.results.find((item) => item.workspaceId === selected) ?? memberships.results[0];
  if (!membership) throw new Response("Create a workspace first", { status: 409 });

  let slug = membership.slug;
  if (!slug) {
    slug = makeWorkspaceSlug(membership.name, membership.workspaceId);
    await env.DB.prepare("UPDATE workspaces SET slug = ? WHERE id = ?").bind(slug, membership.workspaceId).run();
  }

  const capabilityRows = await env.DB.prepare(
    "SELECT capability FROM workspace_capabilities WHERE workspace_id = ? ORDER BY capability",
  ).bind(membership.workspaceId).all<{ capability: string }>();
  const workspaceType = isWorkspaceType(membership.workspaceType) ? membership.workspaceType : "business_showcase";
  const workspaceCapabilities = capabilityRows.results.map((row) => row.capability).filter(isCapability);
  const services = await listServiceEntitlements(membership.workspaceId);

  return {
    user,
    workspace: {
      id: membership.workspaceId,
      name: membership.name,
      type: workspaceType,
      businessCategory: membership.businessCategory,
      capabilities: workspaceCapabilities,
      services,
      slug,
      themeId: membership.themeId || "atelier",
    },
    role: membership.role,
  };
}

export async function listUserWorkspaces(userId: string) {
  const workspaces = await env.DB.prepare(membershipQuery).bind(userId).all<MembershipRow>();
  return Promise.all(workspaces.results.map(async (workspace) => {
    const capabilityRows = await env.DB.prepare(
      "SELECT capability FROM workspace_capabilities WHERE workspace_id = ? ORDER BY capability",
    ).bind(workspace.workspaceId).all<{ capability: string }>();
    const services = await listServiceEntitlements(workspace.workspaceId);
    return {
      id: workspace.workspaceId,
      name: workspace.name,
      type: isWorkspaceType(workspace.workspaceType) ? workspace.workspaceType : "business_showcase",
      businessCategory: workspace.businessCategory,
      capabilities: capabilityRows.results.map((row) => row.capability).filter(isCapability),
      services,
      slug: workspace.slug,
      themeId: workspace.themeId,
      role: workspace.role,
    };
  }));
}

export async function selectWorkspace(workspaceId: string, userId: string) {
  const allowed = await env.DB.prepare(
    "SELECT id FROM memberships WHERE workspace_id = ? AND user_id = ?",
  ).bind(workspaceId, userId).first();
  if (!allowed) throw new Response("Workspace not found", { status: 404 });
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 31536000,
  });
}

export function makeWorkspaceSlug(name: string, id: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "business"}-${id.slice(0, 6)}`;
}
