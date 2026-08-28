import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { writeAuditEvent } from "@/src/core/audit/service";
import { requireAnyServiceEntitlement } from "@/src/core/entitlements/service";

const contentServices = ["ecommerce_website", "pos", "business_showcase", "cv", "portfolio"] as const;

export async function GET() {
  try {
    const { workspace } = requireAnyServiceEntitlement(await authorize("content.read"), contentServices);
    const result = await env.DB.prepare(
      "SELECT id, kind, title, description, price, status FROM content_items WHERE workspace_id = ? ORDER BY created_at DESC",
    ).bind(workspace.id).all();
    return Response.json({ type: workspace.type, capabilities: workspace.capabilities, workspaceId: workspace.id, items: result.results });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const context = requireAnyServiceEntitlement(await authorize("content.write"), contentServices);
    const body = await request.json() as { title?: string; description?: string; price?: number; kind?: string };
    if (!body.title?.trim()) return Response.json({ error: "Title is required" }, { status: 400 });
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO content_items (id, workspace_id, kind, title, description, price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)",
    ).bind(id, context.workspace.id, body.kind || "product", body.title.trim(), body.description?.trim() || "", Math.max(0, Number(body.price) || 0), Date.now()).run();
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "content.created", targetType: "content_item", targetId: id });
    return Response.json({ id }, { status: 201 });
  } catch (error) { return fail(error); }
}

export async function PUT(request: Request) {
  try {
    const context = requireAnyServiceEntitlement(await authorize("content.write"), contentServices);
    const body = await request.json() as { id?: string; title?: string; description?: string; price?: number; status?: string };
    if (!body.id || !body.title?.trim()) return Response.json({ error: "ID and title are required" }, { status: 400 });
    const result = await env.DB.prepare(
      "UPDATE content_items SET title = ?, description = ?, price = ?, status = ? WHERE id = ? AND workspace_id = ?",
    ).bind(body.title.trim(), body.description?.trim() || "", Math.max(0, Number(body.price) || 0), body.status || "active", body.id, context.workspace.id).run();
    if (!result.meta.changes) return Response.json({ error: "Content not found" }, { status: 404 });
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "content.updated", targetType: "content_item", targetId: body.id });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    const context = requireAnyServiceEntitlement(await authorize("content.delete"), contentServices);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "ID is required" }, { status: 400 });
    const result = await env.DB.prepare("DELETE FROM content_items WHERE id = ? AND workspace_id = ?").bind(id, context.workspace.id).run();
    if (!result.meta.changes) return Response.json({ error: "Content not found" }, { status: 404 });
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "content.deleted", targetType: "content_item", targetId: id });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}

function fail(error: unknown) {
  return error instanceof Response ? error : Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
}
