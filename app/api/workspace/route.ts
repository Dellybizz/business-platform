import { env } from "cloudflare:workers";
import {
  ensureUser,
  listUserWorkspaces,
  requireTenant,
  selectWorkspace,
} from "@/lib/auth/tenant";
import {
  isCapability,
  legacyModeFor,
  starterSectionsFor,
  workspacePresets,
} from "@/src/core/workspaces/model";
import {
  OnboardingValidationError,
  onboardingKey,
  validateWorkspaceOnboarding,
  type WorkspaceOnboardingInput,
} from "@/src/core/workspaces/onboarding";
import { requirePermission } from "@/src/core/authorization/service";
import { writeAuditEvent } from "@/src/core/audit/service";
import { capabilitiesForServices } from "@/src/core/entitlements/model";
import { requireAnyServiceEntitlement } from "@/src/core/entitlements/service";
import { documentFromLegacySections } from "@/src/website/page-document";
import { publishPage, readDraftPage, saveDraft } from "@/src/website/service";

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission(await requireTenant(), "workspace.read");
    const workspaceId = ctx.workspace.id;
    const pageSlug = new URL(request.url).searchParams.get("page") || "home";
    const pageRecord = await env.DB.prepare("SELECT id,status FROM pages WHERE workspace_id=? AND slug=? AND deleted_at IS NULL").bind(workspaceId,pageSlug).first<{id:string;status:string}>();
    const page = pageRecord ? await readDraftPage(env.DB,workspaceId,pageRecord.id) : null;
    const [items, requests, customers, unread] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS total FROM content_items WHERE workspace_id = ?").bind(workspaceId),
      env.DB.prepare("SELECT COUNT(*) AS total FROM submissions WHERE workspace_id = ?").bind(workspaceId),
      env.DB.prepare("SELECT COUNT(DISTINCT email) AS total FROM submissions WHERE workspace_id = ?").bind(workspaceId),
      env.DB.prepare("SELECT COUNT(*) AS total FROM submissions WHERE workspace_id = ? AND status = 'new'").bind(workspaceId),
    ]);
    const total = (result: D1Result) => Number((result.results[0] as { total?: number } | undefined)?.total || 0);
    return Response.json({
      user: ctx.user,
      workspace: ctx.workspace,
      workspaces: await listUserWorkspaces(ctx.user.id),
      page: page
        ? {
            ...page,
            status: pageRecord?.status,
            sections: page.document.sections,
            document: undefined,
          }
        : null,
      summary: {
        items: total(items),
        requests: total(requests),
        customers: total(customers),
        unread: total(unread),
      },
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await ensureUser();
    const input = validateWorkspaceOnboarding((await request.json()) as WorkspaceOnboardingInput);
    const key = onboardingKey(identity.id, input);
    const existing = await env.DB.prepare(
      `SELECT w.id, w.slug
       FROM workspaces w
       JOIN memberships m ON m.workspace_id = w.id
       WHERE w.onboarding_key = ? AND m.user_id = ?`,
    ).bind(key, identity.id).first<{ id: string; slug: string }>();
    if (existing) {
      await selectWorkspace(existing.id, identity.id);
      return Response.json({
        id: existing.id,
        slug: existing.slug,
        dashboardUrl: "/dashboard",
        idempotent: true,
      });
    }

    const slugOwner = await env.DB.prepare(
      `SELECT w.id, w.slug, m.user_id AS userId
       FROM workspaces w
       LEFT JOIN memberships m ON m.workspace_id = w.id
       WHERE w.slug = ?`,
    ).bind(input.slug).first<{ id: string; slug: string; userId: string | null }>();
    if (slugOwner?.userId === identity.id) {
      await selectWorkspace(slugOwner.id, identity.id);
      return Response.json({
        id: slugOwner.id,
        slug: slugOwner.slug,
        dashboardUrl: "/dashboard",
        idempotent: true,
      });
    }
    if (slugOwner) return Response.json({ error: "That preferred slug is already in use" }, { status: 409 });

    const id = crypto.randomUUID();
    const now = Date.now();
    const preset = workspacePresets[input.type];
    const selectedCapabilities = capabilitiesForServices(input.services);
    const siteId = crypto.randomUUID();
    const starterPages = selectedCapabilities.includes("website") ? preset.starterPages.map((page) => ({page,id:crypto.randomUUID(),versionId:crypto.randomUUID()})) : [];
    const statements = [
      env.DB.prepare(
        `INSERT INTO workspaces
          (id, name, slug, mode, workspace_type, business_category, onboarding_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        input.name,
        input.slug,
        legacyModeFor(input.type),
        input.type,
        input.businessCategory,
        key,
        now,
        now,
      ),
      env.DB.prepare(
        "INSERT INTO memberships (id, user_id, workspace_id, role, created_at) VALUES (?, ?, ?, 'owner', ?)",
      ).bind(crypto.randomUUID(), identity.id, id, now),
      ...(selectedCapabilities.includes("website") ? [env.DB.prepare("INSERT INTO sites (id,workspace_id,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)").bind(siteId,id,input.name,now,now)] : []),
      ...input.services.map((service) => env.DB.prepare(
        `INSERT INTO workspace_service_entitlements
          (workspace_id, service, status, activated_at, trial_ends_at, suspended_at, cancelled_at, updated_at)
         VALUES (?, ?, 'active', ?, NULL, NULL, NULL, ?)`,
      ).bind(id, service, now, now)),
      ...selectedCapabilities.map((capability) => env.DB.prepare(
        "INSERT INTO workspace_capabilities (workspace_id, capability, enabled_at) VALUES (?, ?, ?)",
      ).bind(id, capability, now)),
      ...starterPages.flatMap(({page,id:pageId,versionId}) => [env.DB.prepare(
        "INSERT INTO pages (id,workspace_id,site_id,slug,title,status,sections_json,page_type,draft_version_id,indexable,created_at,updated_at) VALUES (?,?,?,?,?,'draft',?, ?,?,1,?,?)",
      ).bind(
        pageId,id,siteId,page.slug,page.title,JSON.stringify(starterSectionsFor(input.type,page)),page.slug==='home'?'home':page.slug==='contact'?'contact':'standard',versionId,now,now,
      ),env.DB.prepare("INSERT INTO page_versions (id,page_id,version_number,state,schema_version,document_json,created_by,created_at) VALUES (?,?,1,'draft',1,?,?,?)").bind(versionId,pageId,JSON.stringify(documentFromLegacySections(starterSectionsFor(input.type,page))),identity.id,now)]),
    ];
    try {
      await env.DB.batch(statements);
    } catch (cause) {
      const repeated = await env.DB.prepare(
        `SELECT w.id, w.slug
         FROM workspaces w
         JOIN memberships m ON m.workspace_id = w.id
         WHERE (w.onboarding_key = ? OR w.slug = ?) AND m.user_id = ?`,
      ).bind(key, input.slug, identity.id).first<{ id: string; slug: string }>();
      if (!repeated) throw cause;
      await selectWorkspace(repeated.id, identity.id);
      return Response.json({
        id: repeated.id,
        slug: repeated.slug,
        dashboardUrl: "/dashboard",
        idempotent: true,
      });
    }
    await selectWorkspace(id, identity.id);
    await writeAuditEvent({ workspaceId: id, actorUserId: identity.id, action: "workspace.created", targetType: "workspace", targetId: id, metadata: { type: input.type, services: input.services } });
    return Response.json({ id, slug: input.slug, dashboardUrl: "/dashboard", idempotent: false }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireTenant();
    await requirePermission(ctx, "workspace.read");
    const body = (await request.json()) as { workspaceId?: string };
    if (!body.workspaceId) return Response.json({ error: "Workspace is required" }, { status: 400 });
    await selectWorkspace(body.workspaceId, ctx.user.id);
    await writeAuditEvent({ workspaceId: body.workspaceId, actorUserId: ctx.user.id, action: "workspace.selected", targetType: "workspace", targetId: body.workspaceId });
    return Response.json({ ok: true, dashboardUrl: "/dashboard" });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await requireTenant();
    const workspaceId = ctx.workspace.id;
    const body = (await request.json()) as {
      name?: string;
      businessCategory?: string;
      themeId?: string;
      addCapabilities?: unknown[];
      sections?: unknown[];
      status?: string;
      pageSlug?: string;
    };
    const now = Date.now();
    const statements = [];
    const name = body.name?.trim().slice(0, 100) || null;
    const category = body.businessCategory?.trim().slice(0, 80) || null;
    const categoryWasProvided = body.businessCategory !== undefined;
    if (name || categoryWasProvided || body.themeId) await requirePermission(ctx, "settings.write");
    if (Array.isArray(body.addCapabilities) && body.addCapabilities.length) await requirePermission(ctx, "capabilities.write");
    if (body.sections) {
      requireAnyServiceEntitlement(ctx, ["ecommerce_website", "business_showcase", "cv", "portfolio"]);
      await requirePermission(ctx, "pages.write");
    }
    if (body.status === "published") await requirePermission(ctx, "pages.publish");
    if (name || body.businessCategory !== undefined || body.themeId) {
      statements.push(env.DB.prepare(
        `UPDATE workspaces
         SET name = COALESCE(?, name),
           business_category = CASE WHEN ? = 1 THEN ? ELSE business_category END,
           theme_id = COALESCE(?, theme_id), updated_at = ?
         WHERE id = ?`,
      ).bind(name, categoryWasProvided ? 1 : 0, category, body.themeId || null, now, workspaceId));
    }
    const additions = Array.isArray(body.addCapabilities)
      ? [...new Set(body.addCapabilities.filter(isCapability))]
      : [];
    for (const capability of additions) {
      statements.push(env.DB.prepare(
        "INSERT OR IGNORE INTO workspace_capabilities (workspace_id, capability, enabled_at) VALUES (?, ?, ?)",
      ).bind(workspaceId, capability, now));
    }
    if (statements.length) await env.DB.batch(statements);
    if (body.sections || body.status === "published") {
      const page=await env.DB.prepare("SELECT id FROM pages WHERE workspace_id=? AND slug=? AND deleted_at IS NULL").bind(workspaceId,body.pageSlug||"home").first<{id:string}>();
      if(!page) throw new Response("Page not found",{status:404});
      if(body.sections) await saveDraft(env.DB,{workspaceId,pageId:page.id,actorUserId:ctx.user.id,document:documentFromLegacySections(body.sections)});
      if(body.status==="published") await publishPage(env.DB,{workspaceId,pageId:page.id,actorUserId:ctx.user.id});
    }
    if (statements.length) await writeAuditEvent({
      workspaceId,
      actorUserId: ctx.user.id,
      action: body.status === "published" ? "page.published" : body.sections ? "page.updated" : "workspace.updated",
      targetType: body.sections || body.status ? "page" : "workspace",
      targetId: body.sections || body.status ? body.pageSlug || "home" : workspaceId,
      metadata: { addedCapabilities: additions },
    });
    return Response.json({ ok: true, updatedAt: now });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof Response) return error;
  if (error instanceof OnboardingValidationError) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(
    { error: error instanceof Error ? error.message : "Unexpected error" },
    { status: 500 },
  );
}
