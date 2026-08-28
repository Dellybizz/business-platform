import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isCapability, isWorkspaceType, type Capability, type WorkspaceType } from "@/src/core/workspaces/model";

export type TenantContext = {
  user: { id: string; email: string; displayName: string };
  workspace: {
    id: string;
    name: string;
    type: WorkspaceType;
    businessCategory: string | null;
    capabilities: Capability[];
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
  const identity = await getChatGPTUser();
  if (!identity) throw new Response("Authentication required", { status: 401 });
  let user = await env.DB.prepare(
    "SELECT id, email, display_name AS displayName FROM users WHERE email = ?",
  ).bind(identity.email).first<{ id: string; email: string; displayName: string }>();
  if (!user) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)",
    ).bind(id, identity.email, identity.displayName, Date.now()).run();
    user = { id, email: identity.email, displayName: identity.displayName };
  }
  return user;
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
  let memberships = await env.DB.prepare(membershipQuery).bind(user.id).all<MembershipRow>();
  if (!memberships.results.length) {
    const claimed = await env.DB.prepare("SELECT COUNT(*) AS total FROM memberships").first<{ total: number }>();
    const legacy = Number(claimed?.total || 0) === 0
      ? await env.DB.prepare("SELECT id FROM workspaces WHERE id = 'demo-workspace'").first<{ id: string }>()
      : null;
    if (legacy) {
      await env.DB.prepare(
        "INSERT INTO memberships (id, user_id, workspace_id, role, created_at) VALUES (?, ?, ?, 'owner', ?)",
      ).bind(crypto.randomUUID(), user.id, legacy.id, Date.now()).run();
      memberships = await env.DB.prepare(membershipQuery).bind(user.id).all<MembershipRow>();
    }
  }

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

  return {
    user,
    workspace: {
      id: membership.workspaceId,
      name: membership.name,
      type: workspaceType,
      businessCategory: membership.businessCategory,
      capabilities: workspaceCapabilities,
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
    return {
      id: workspace.workspaceId,
      name: workspace.name,
      type: isWorkspaceType(workspace.workspaceType) ? workspace.workspaceType : "business_showcase",
      businessCategory: workspace.businessCategory,
      capabilities: capabilityRows.results.map((row) => row.capability).filter(isCapability),
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
