import { env } from "cloudflare:workers";
import {
  ensureUser,
  listUserWorkspaces,
  makeWorkspaceSlug,
  requireTenant,
  selectWorkspace,
} from "@/lib/auth/tenant";

export async function GET(request: Request) {
  try {
    const ctx = await requireTenant(),
      workspaceId = ctx.workspace.id,
      pageSlug = new URL(request.url).searchParams.get("page") || "home";
    const page = await env.DB.prepare(
      "SELECT id, title, slug, status, sections_json AS sectionsJson, updated_at AS updatedAt FROM pages WHERE workspace_id = ? AND slug = ?",
    )
      .bind(workspaceId, pageSlug)
      .first();
    const [items, requests, customers, unread] = await env.DB.batch([
      env.DB.prepare(
        "SELECT COUNT(*) AS total FROM content_items WHERE workspace_id = ?",
      ).bind(workspaceId),
      env.DB.prepare(
        "SELECT COUNT(*) AS total FROM submissions WHERE workspace_id = ?",
      ).bind(workspaceId),
      env.DB.prepare(
        "SELECT COUNT(DISTINCT email) AS total FROM submissions WHERE workspace_id = ?",
      ).bind(workspaceId),
      env.DB.prepare(
        "SELECT COUNT(*) AS total FROM submissions WHERE workspace_id = ? AND status = 'new'",
      ).bind(workspaceId),
    ]);
    const total = (r: D1Result) =>
      Number((r.results[0] as { total?: number } | undefined)?.total || 0);
    return Response.json({
      user: ctx.user,
      workspace: ctx.workspace,
      workspaces: await listUserWorkspaces(ctx.user.id),
      page: page
        ? {
            ...page,
            sections: JSON.parse(String(page.sectionsJson || "[]")),
            sectionsJson: undefined,
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
    const body = (await request.json()) as { name?: string; mode?: string };
    if (!body.name?.trim())
      return Response.json(
        { error: "Business name is required" },
        { status: 400 },
      );
    const id = crypto.randomUUID(),
      pageId = crypto.randomUUID(),
      now = Date.now(),
      slug = makeWorkspaceSlug(body.name.trim(), id);
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO workspaces (id, name, slug, mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(id, body.name.trim(), slug, body.mode || "store", now, now),
      env.DB.prepare(
        "INSERT INTO memberships (id, user_id, workspace_id, role, created_at) VALUES (?, ?, ?, 'owner', ?)",
      ).bind(crypto.randomUUID(), identity.id, id, now),
      env.DB.prepare(
        "INSERT INTO pages (id, workspace_id, slug, title, status, sections_json, updated_at) VALUES (?, ?, 'home', 'Homepage', 'draft', '[]', ?)",
      ).bind(pageId, id, now),
    ]);
    await selectWorkspace(id, identity.id);
    return Response.json({ id, slug }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireTenant();
    const body = (await request.json()) as { workspaceId?: string };
    if (!body.workspaceId)
      return Response.json({ error: "Workspace is required" }, { status: 400 });
    await selectWorkspace(body.workspaceId, ctx.user.id);
    return Response.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await requireTenant(),
      workspaceId = ctx.workspace.id;
    const body = (await request.json()) as {
      mode?: string;
      name?: string;
      themeId?: string;
      sections?: unknown[];
      status?: string;
      pageSlug?: string;
    };
    const now = Date.now(),
      statements = [];
    if (body.mode || body.name || body.themeId)
      statements.push(
        env.DB.prepare(
          "UPDATE workspaces SET mode = COALESCE(?, mode), name = COALESCE(?, name), theme_id = COALESCE(?, theme_id), updated_at = ? WHERE id = ?",
        ).bind(
          body.mode || null,
          body.name || null,
          body.themeId || null,
          now,
          workspaceId,
        ),
      );
    if (body.sections || body.status)
      statements.push(
        env.DB.prepare(
          "UPDATE pages SET sections_json = COALESCE(?, sections_json), status = COALESCE(?, status), updated_at = ? WHERE workspace_id = ? AND slug = ?",
        ).bind(
          body.sections ? JSON.stringify(body.sections) : null,
          body.status || null,
          now,
          workspaceId,
          body.pageSlug || "home",
        ),
      );
    if (statements.length) await env.DB.batch(statements);
    return Response.json({ ok: true, updatedAt: now });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof Response) return error;
  return Response.json(
    { error: error instanceof Error ? error.message : "Unexpected error" },
    { status: 500 },
  );
}
