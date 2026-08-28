import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { writeAuditEvent } from "@/src/core/audit/service";
import { requireAnyServiceEntitlement } from "@/src/core/entitlements/service";

const websiteServices = ["ecommerce_website", "business_showcase", "cv", "portfolio"] as const;

export async function GET() {
  try {
    const context = requireAnyServiceEntitlement(await authorize("submissions.read"), websiteServices);
    const result = await env.DB.prepare(
      "SELECT id, type, item_title AS itemTitle, customer_name AS customerName, email, phone, message, status, created_at AS createdAt FROM submissions WHERE workspace_id = ? ORDER BY created_at DESC",
    ).bind(context.workspace.id).all();
    return Response.json({ submissions: result.results });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const context = requireAnyServiceEntitlement(await authorize("submissions.write"), websiteServices);
    const body = await request.json() as { type?: string; itemId?: string; itemTitle?: string; customerName?: string; email?: string; phone?: string; message?: string };
    if (!body.customerName?.trim() || !body.email?.trim()) return Response.json({ error: "Name and email are required" }, { status: 400 });
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO submissions (id, workspace_id, type, item_id, item_title, customer_name, email, phone, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)",
    ).bind(id, context.workspace.id, body.type || "enquiry", body.itemId || null, body.itemTitle || "General enquiry", body.customerName.trim(), body.email.trim(), body.phone?.trim() || "", body.message?.trim() || "", Date.now()).run();
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "submission.created", targetType: "submission", targetId: id });
    return Response.json({ id }, { status: 201 });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    const context = requireAnyServiceEntitlement(await authorize("submissions.write"), websiteServices);
    const body = await request.json() as { id?: string; status?: string };
    if (!body.id) return Response.json({ error: "ID is required" }, { status: 400 });
    const result = await env.DB.prepare(
      "UPDATE submissions SET status = ? WHERE id = ? AND workspace_id = ?",
    ).bind(body.status || "read", body.id, context.workspace.id).run();
    if (!result.meta.changes) return Response.json({ error: "Submission not found" }, { status: 404 });
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "submission.updated", targetType: "submission", targetId: body.id, metadata: { status: body.status || "read" } });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}

function fail(error: unknown) {
  return error instanceof Response ? error : Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
}
