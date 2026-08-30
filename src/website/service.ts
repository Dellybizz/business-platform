import { sha256 } from "@/src/core/identity/crypto";
import {
  documentFromLegacySections,
  parsePageDocument,
  validatePageDocument,
  type PageType,
} from "./page-document";

export type WebsiteDatabase = Pick<D1Database, "prepare" | "batch">;
export type PageSeo = {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  socialImageAssetId?: string | null;
  indexable?: boolean;
};

const cleanSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const allowedPageTypes = new Set(["home", "standard", "product", "collection", "service", "portfolio_project", "article", "contact"]);

export async function ensureSite(db: WebsiteDatabase, workspace: { id: string; name: string }) {
  const existing = await db.prepare("SELECT id FROM sites WHERE workspace_id=?").bind(workspace.id).first<{ id: string }>();
  if (existing) return existing.id;
  const id = crypto.randomUUID(), now = Date.now();
  await db.prepare("INSERT INTO sites (id,workspace_id,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)")
    .bind(id, workspace.id, workspace.name, now, now).run();
  return id;
}

export async function listPages(db: WebsiteDatabase, workspaceId: string) {
  return (await db.prepare(`SELECT p.id,p.title,p.slug,p.page_type AS pageType,p.status,p.updated_at AS updatedAt,
    p.draft_version_id AS draftVersionId,p.published_version_id AS publishedVersionId
    FROM pages p JOIN sites s ON s.id=p.site_id WHERE s.workspace_id=? AND p.deleted_at IS NULL
    ORDER BY CASE WHEN p.page_type='home' THEN 0 ELSE 1 END,p.updated_at DESC`).bind(workspaceId).all()).results;
}

export async function createPage(db: WebsiteDatabase, input: {
  workspace: { id: string; name: string }; actorUserId: string; title: string; slug?: string; pageType?: PageType; templateKey?: string | null; document?: unknown;
}) {
  const title = input.title.trim().slice(0, 120);
  if (!title) throw new Error("Page title is required");
  const pageType = input.pageType ?? "standard";
  if (!allowedPageTypes.has(pageType)) throw new Error("Unsupported page type");
  const siteId = await ensureSite(db, input.workspace);
  const pageId = crypto.randomUUID(), versionId = crypto.randomUUID(), now = Date.now();
  const slug = cleanSlug(input.slug || title) || `page-${pageId.slice(0, 8)}`;
  const document = input.document ? validatePageDocument(input.document) : documentFromLegacySections([]);
  await db.batch([
    db.prepare(`INSERT INTO pages (id,workspace_id,site_id,slug,title,status,sections_json,page_type,template_key,draft_version_id,indexable,created_at,updated_at)
      VALUES (?,?,?,?,?,'draft','[]',?,?,?,1,?,?)`).bind(pageId,input.workspace.id,siteId,slug,title,pageType,input.templateKey||null,versionId,now,now),
    db.prepare(`INSERT INTO page_versions (id,page_id,version_number,state,schema_version,document_json,created_by,created_at)
      VALUES (?,?,1,'draft',1,?,?,?)`).bind(versionId,pageId,JSON.stringify(document),input.actorUserId,now),
  ]);
  return { id: pageId, slug, draftVersionId: versionId };
}

async function ownedPage(db: WebsiteDatabase, workspaceId: string, pageId: string) {
  const page = await db.prepare(`SELECT p.*,s.id AS resolved_site_id FROM pages p JOIN sites s ON s.id=p.site_id
    WHERE p.id=? AND s.workspace_id=? AND p.deleted_at IS NULL`).bind(pageId,workspaceId).first<Record<string, unknown>>();
  if (!page) throw new Response("Page not found", { status: 404 });
  return page;
}

export async function readDraftPage(db: WebsiteDatabase, workspaceId: string, pageId: string) {
  await ownedPage(db, workspaceId, pageId);
  const row = await db.prepare(`SELECT p.id,p.title,p.slug,p.page_type AS pageType,p.template_key AS templateKey,
    p.seo_title AS seoTitle,p.seo_description AS seoDescription,p.canonical_url AS canonicalUrl,
    p.social_image_asset_id AS socialImageAssetId,p.indexable,v.id AS versionId,v.document_json AS documentJson,v.version_number AS versionNumber
    FROM pages p JOIN page_versions v ON v.id=p.draft_version_id WHERE p.id=?`).bind(pageId).first<{
      id:string;title:string;slug:string;pageType:string;templateKey:string|null;seoTitle:string|null;seoDescription:string|null;canonicalUrl:string|null;socialImageAssetId:string|null;indexable:number;versionId:string;documentJson:string;versionNumber:number;
    }>();
  if (!row) throw new Response("Draft not found", { status: 404 });
  return { ...row, indexable: Boolean(row.indexable), document: parsePageDocument(String(row.documentJson)), documentJson: undefined };
}

export async function saveDraft(db: WebsiteDatabase, input: { workspaceId: string; pageId: string; actorUserId: string; document: unknown; title?: string; slug?: string; pageType?: PageType; seo?: PageSeo }) {
  const page = await ownedPage(db,input.workspaceId,input.pageId);
  const document = validatePageDocument(input.document), now = Date.now();
  const draftId = String(page.draft_version_id || "");
  if (!draftId) throw new Error("Page has no draft version");
  const slug = input.slug === undefined ? null : cleanSlug(input.slug);
  if (input.pageType && !allowedPageTypes.has(input.pageType)) throw new Error("Unsupported page type");
  await db.batch([
    db.prepare("UPDATE page_versions SET document_json=?,schema_version=1,created_by=?,created_at=? WHERE id=? AND state='draft'")
      .bind(JSON.stringify(document),input.actorUserId,now,draftId),
    db.prepare(`UPDATE pages SET title=COALESCE(?,title),slug=COALESCE(?,slug),page_type=COALESCE(?,page_type),
      seo_title=COALESCE(?,seo_title),seo_description=COALESCE(?,seo_description),canonical_url=COALESCE(?,canonical_url),
      social_image_asset_id=COALESCE(?,social_image_asset_id),indexable=COALESCE(?,indexable),updated_at=? WHERE id=?`)
      .bind(input.title?.trim()||null,slug,input.pageType||null,input.seo?.title??null,input.seo?.description??null,input.seo?.canonicalUrl??null,input.seo?.socialImageAssetId??null,input.seo?.indexable===undefined?null:Number(input.seo.indexable),now,input.pageId),
  ]);
  return { draftVersionId: draftId, updatedAt: now };
}

export async function publishPage(db: WebsiteDatabase, input: { workspaceId: string; pageId: string; actorUserId: string }) {
  const page = await ownedPage(db,input.workspaceId,input.pageId);
  const draft = await db.prepare("SELECT document_json,schema_version FROM page_versions WHERE id=? AND state='draft'").bind(String(page.draft_version_id)).first<{document_json:string;schema_version:number}>();
  if (!draft) throw new Error("Page has no valid draft");
  parsePageDocument(draft.document_json);
  const publishedId=crypto.randomUUID(),now=Date.now();
  const max=await db.prepare("SELECT COALESCE(MAX(version_number),0) AS value FROM page_versions WHERE page_id=?").bind(input.pageId).first<{value:number}>();
  const version=Number(max?.value||0)+1;
  await db.batch([
    db.prepare("UPDATE page_versions SET state='archived' WHERE page_id=? AND state='published'").bind(input.pageId),
    db.prepare("INSERT INTO page_versions (id,page_id,version_number,state,schema_version,document_json,created_by,created_at,published_at) VALUES (?,?,?,'published',1,?,?,?,?)")
      .bind(publishedId,input.pageId,version,draft.document_json,input.actorUserId,now,now),
    db.prepare("UPDATE page_versions SET id=id WHERE id=? AND state='draft'").bind(String(page.draft_version_id)),
    db.prepare("UPDATE pages SET status='published',published_version_id=?,updated_at=? WHERE id=?").bind(publishedId,now,input.pageId),
  ]);
  // The existing draft row remains mutable; the published row is an immutable snapshot.
  return { publishedVersionId: publishedId, publishedAt: now };
}

export async function unpublishPage(db: WebsiteDatabase, workspaceId: string, pageId: string) {
  await ownedPage(db,workspaceId,pageId); const now=Date.now();
  await db.batch([
    db.prepare("UPDATE page_versions SET state='archived' WHERE page_id=? AND state='published'").bind(pageId),
    db.prepare("UPDATE pages SET status='draft',published_version_id=NULL,updated_at=? WHERE id=?").bind(now,pageId),
  ]);
  return { unpublishedAt: now };
}

export async function duplicatePage(db: WebsiteDatabase, input: { workspace: {id:string;name:string}; actorUserId:string; pageId:string }) {
  const source=await readDraftPage(db,input.workspace.id,input.pageId);
  return createPage(db,{workspace:input.workspace,actorUserId:input.actorUserId,title:`Copy of ${String(source.title)}`,slug:`${String(source.slug)}-copy`,pageType:source.pageType as PageType,templateKey:source.templateKey as string|null,document:source.document});
}

export async function deletePage(db: WebsiteDatabase, workspaceId:string,pageId:string) {
  const page=await ownedPage(db,workspaceId,pageId);
  if (page.page_type==='home') throw new Response("The home page cannot be deleted",{status:409});
  const now=Date.now();
  await db.prepare("UPDATE pages SET deleted_at=?,status='deleted',published_version_id=NULL,updated_at=? WHERE id=?").bind(now,now,pageId).run();
  await db.prepare("UPDATE page_versions SET state='archived' WHERE page_id=? AND state IN ('draft','published')").bind(pageId).run();
  return {deletedAt:now};
}

export async function createPreviewToken(db:WebsiteDatabase,input:{workspaceId:string;pageId:string;actorUserId:string;ttlMs?:number}){
  const page=await ownedPage(db,input.workspaceId,input.pageId), token=crypto.randomUUID()+crypto.randomUUID(), now=Date.now();
  await db.prepare("INSERT INTO site_preview_tokens (id,site_id,page_id,token_hash,expires_at,created_by,created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),String(page.resolved_site_id),input.pageId,await sha256(token),now+Math.min(input.ttlMs||3600000,86400000),input.actorUserId,now).run();
  return {token,expiresAt:now+Math.min(input.ttlMs||3600000,86400000)};
}

export async function resolvePublicPage(db:WebsiteDatabase,input:{slug?:string;hostname?:string;pageSlug:string;previewToken?:string|null}){
  const hostname=input.hostname?.toLowerCase().split(":")[0];
  const site=await db.prepare(`SELECT s.id,s.workspace_id AS workspaceId,w.name,w.slug,w.mode,w.workspace_type AS workspaceType,w.theme_id AS themeId
    FROM sites s JOIN workspaces w ON w.id=s.workspace_id LEFT JOIN custom_domains d ON d.site_id=s.id AND d.status='verified' AND d.verified_at IS NOT NULL
    WHERE s.status='active' AND EXISTS (SELECT 1 FROM workspace_service_entitlements se WHERE se.workspace_id=w.id AND se.service IN ('ecommerce_website','business_showcase','cv','portfolio') AND (se.status='active' OR (se.status='trial' AND (se.trial_ends_at IS NULL OR se.trial_ends_at>?))))
      AND ((? IS NOT NULL AND w.slug=?) OR (? IS NOT NULL AND d.hostname=?)) LIMIT 1`)
    .bind(Date.now(),input.slug||null,input.slug||null,hostname||null,hostname||null).first<Record<string,unknown>>();
  if(!site) return null;
  const page=await db.prepare("SELECT * FROM pages WHERE site_id=? AND slug=? AND deleted_at IS NULL").bind(String(site.id),input.pageSlug).first<Record<string,unknown>>();
  if(!page) return null;
  let versionId=page.published_version_id as string|null;
  let preview=false;
  if(input.previewToken){
    const valid=await db.prepare("SELECT 1 AS ok FROM site_preview_tokens WHERE site_id=? AND (page_id IS NULL OR page_id=?) AND token_hash=? AND revoked_at IS NULL AND expires_at>?")
      .bind(String(site.id),String(page.id),await sha256(input.previewToken),Date.now()).first();
    if(valid){versionId=page.draft_version_id as string;preview=true;}
  }
  if(!versionId) return null;
  const version=await db.prepare("SELECT document_json AS documentJson FROM page_versions WHERE id=? AND state=?").bind(versionId,preview?'draft':'published').first<{documentJson:string}>();
  if(!version) return null;
  return {site,page:{id:String(page.id),title:String(page.title),slug:String(page.slug),pageType:String(page.page_type),seo:{title:page.seo_title==null?null:String(page.seo_title),description:page.seo_description==null?null:String(page.seo_description),canonicalUrl:page.canonical_url==null?null:String(page.canonical_url),socialImageAssetId:page.social_image_asset_id==null?null:String(page.social_image_asset_id),indexable:Boolean(page.indexable)},document:parsePageDocument(version.documentJson)},preview};
}
