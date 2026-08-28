import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { writeAuditEvent } from "@/src/core/audit/service";
import { requireAnyServiceEntitlement } from "@/src/core/entitlements/service";

const websiteServices = ["ecommerce_website", "business_showcase", "cv", "portfolio"] as const;

const clean = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

export async function GET() {
  try {
    const context = requireAnyServiceEntitlement(await authorize("pages.read"), websiteServices);
    const result = await env.DB.prepare(
      "SELECT id,title,slug,status,updated_at AS updatedAt FROM pages WHERE workspace_id=? ORDER BY CASE WHEN slug='home' THEN 0 ELSE 1 END, updated_at DESC",
    ).bind(context.workspace.id).all();
    return Response.json({ pages: result.results });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const context = requireAnyServiceEntitlement(await authorize("pages.write"), websiteServices);
    const body = await request.json() as { title?: string };
    if (!body.title?.trim()) return Response.json({ error: "Page title is required" }, { status: 400 });
    const base = clean(body.title) || "page";
    const slug = `${base}-${crypto.randomUUID().slice(0, 4)}`;
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO pages (id,workspace_id,slug,title,status,sections_json,updated_at) VALUES (?,?,?,?, 'draft','[]',?)",
    ).bind(id, context.workspace.id, slug, body.title.trim(), Date.now()).run();
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "page.created", targetType: "page", targetId: id });
    return Response.json({ id, slug }, { status: 201 });
  } catch (error) { return fail(error); }
}

function fail(error: unknown) {
  return error instanceof Response ? error : Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
}
