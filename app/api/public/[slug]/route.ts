import { env } from "cloudflare:workers";
import { resolvePublicPage } from "@/src/website/service";
type Context = { params: Promise<{ slug: string }> };
async function findWorkspace(slug: string) {
  return env.DB.prepare(
    `SELECT w.id, w.name, w.workspace_type AS type, w.slug, w.theme_id AS themeId
     FROM workspaces w
     WHERE w.slug = ? AND EXISTS (
       SELECT 1 FROM workspace_service_entitlements se
       WHERE se.workspace_id = w.id
         AND se.service IN ('ecommerce_website','business_showcase','cv','portfolio')
         AND (se.status = 'active' OR (se.status = 'trial' AND (se.trial_ends_at IS NULL OR se.trial_ends_at > ?)))
     )`,
  )
    .bind(slug, Date.now())
    .first<{
      id: string;
      name: string;
      type: string;
      slug: string;
      themeId: string;
    }>();
}
export async function GET(request: Request, { params }: Context) {
  const { slug } = await params, url=new URL(request.url), pageSlug=url.searchParams.get("page")||"home";
  const resolved=await resolvePublicPage(env.DB,{slug,hostname:request.headers.get("host")||undefined,pageSlug,previewToken:url.searchParams.get("preview")});
  if(!resolved)return Response.json({error:"Site not found"},{status:404});
  const workspace={id:String(resolved.site.workspaceId),name:String(resolved.site.name),type:String(resolved.site.workspaceType),slug:String(resolved.site.slug),themeId:String(resolved.site.themeId),mode:String(resolved.site.mode)};
  const [items, navigation] = await Promise.all([
    env.DB.prepare(
      "SELECT id, kind, title, description, price, status FROM content_items WHERE workspace_id = ? AND status = 'active' ORDER BY created_at DESC",
    )
      .bind(workspace.id)
      .all(),
    env.DB.prepare(`SELECT i.id,i.parent_id AS parentId,i.label,i.url,i.position FROM navigation_menu_items i JOIN navigation_menus m ON m.id=i.menu_id JOIN sites s ON s.id=m.site_id WHERE s.workspace_id=? AND m.handle='main' ORDER BY i.position`).bind(workspace.id).all(),
  ]);
  return Response.json({
    workspace,
    page: {...resolved.page,sections:resolved.page.document.sections,dataSources:resolved.page.document.dataSources,document:undefined},
    preview:resolved.preview,
    items: items.results,
    navigation: navigation.results,
  });
}
export async function POST(request: Request, { params }: Context) {
  const { slug } = await params,
    workspace = await findWorkspace(slug);
  if (!workspace)
    return Response.json({ error: "Site not found" }, { status: 404 });
  const body = (await request.json()) as {
    type?: string;
    itemId?: string;
    itemTitle?: string;
    customerName?: string;
    email?: string;
    phone?: string;
    message?: string;
  };
  if (!body.customerName?.trim() || !body.email?.trim())
    return Response.json(
      { error: "Name and email are required" },
      { status: 400 },
    );
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO submissions (id, workspace_id, type, item_id, item_title, customer_name, email, phone, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)",
  )
    .bind(
      id,
      workspace.id,
      body.type || "enquiry",
      body.itemId || null,
      body.itemTitle || "General enquiry",
      body.customerName.trim(),
      body.email.trim(),
      body.phone?.trim() || "",
      body.message?.trim() || "",
      Date.now(),
    )
    .run();
  return Response.json({ id }, { status: 201 });
}
