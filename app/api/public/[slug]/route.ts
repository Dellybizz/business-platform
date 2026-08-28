import { env } from "cloudflare:workers";
type Context = { params: Promise<{ slug: string }> };
async function findWorkspace(slug: string) {
  return env.DB.prepare(
    "SELECT id, name, mode, slug, theme_id AS themeId FROM workspaces WHERE slug = ?",
  )
    .bind(slug)
    .first<{
      id: string;
      name: string;
      mode: string;
      slug: string;
      themeId: string;
    }>();
}
export async function GET(request: Request, { params }: Context) {
  const { slug } = await params,
    workspace = await findWorkspace(slug),
    pageSlug = new URL(request.url).searchParams.get("page") || "home";
  if (!workspace)
    return Response.json({ error: "Site not found" }, { status: 404 });
  const [page, items] = await Promise.all([
    env.DB.prepare(
      "SELECT title, status, sections_json AS sectionsJson FROM pages WHERE workspace_id = ? AND slug = ?",
    )
      .bind(workspace.id, pageSlug)
      .first(),
    env.DB.prepare(
      "SELECT id, kind, title, description, price, status FROM content_items WHERE workspace_id = ? AND status = 'active' ORDER BY created_at DESC",
    )
      .bind(workspace.id)
      .all(),
  ]);
  if (!page) return Response.json({ error: "Site not found" }, { status: 404 });
  return Response.json({
    workspace,
    page: {
      ...page,
      sections: JSON.parse(String(page.sectionsJson || "[]")),
      sectionsJson: undefined,
    },
    items: items.results,
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
