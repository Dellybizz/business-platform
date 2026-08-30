import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { writeAuditEvent } from "@/src/core/audit/service";
import { requireAnyServiceEntitlement } from "@/src/core/entitlements/service";
import { createPage, listPages } from "@/src/website/service";
import { PageDocumentValidationError } from "@/src/website/page-document";

const websiteServices = ["ecommerce_website", "business_showcase", "cv", "portfolio"] as const;

export async function GET() {
  try {
    const context = requireAnyServiceEntitlement(await authorize("pages.read"), websiteServices);
    return Response.json({ pages: await listPages(env.DB, context.workspace.id) });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const context = requireAnyServiceEntitlement(await authorize("pages.write"), websiteServices);
    const body = await request.json() as { title?: string; slug?: string; pageType?: Parameters<typeof createPage>[1]["pageType"]; templateKey?: string; document?: unknown };
    if (!body.title?.trim()) return Response.json({ error: "Page title is required" }, { status: 400 });
    const page = await createPage(env.DB, { workspace: context.workspace, actorUserId: context.user.id, title: body.title, slug: body.slug, pageType: body.pageType, templateKey: body.templateKey, document: body.document });
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "page.created", targetType: "page", targetId: page.id });
    return Response.json(page, { status: 201 });
  } catch (error) { return fail(error); }
}

function fail(error: unknown) {
  if (error instanceof PageDocumentValidationError) return Response.json({ error: error.message }, { status: 400 });
  return error instanceof Response ? error : Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
}
