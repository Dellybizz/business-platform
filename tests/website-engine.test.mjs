import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root=fileURLToPath(new URL("..",import.meta.url));
const source=(relative)=>readFile(path.join(root,relative),"utf8");

test("Phase 4 defines the complete channel-neutral website data model",async()=>{
  const [schema,migration]=await Promise.all([source("db/schema.ts"),source("drizzle/0010_website_engine.sql")]);
  for(const entity of ["sites","pageVersions","navigationMenus","navigationMenuItems","siteRedirects","siteAssets","sitePreviewTokens"]){assert.match(schema,new RegExp(`export const ${entity}`));}
  for(const type of ["home","standard","product","collection","service","portfolio_project","article","contact"]){assert.match(await source("src/website/page-document.ts"),new RegExp(`"${type}"`));}
  assert.match(migration,/json_object\('schemaVersion',1,'sections',json\(`sections_json`\)\)/);
  assert.match(migration,/published_version_id/);
});

test("page documents are versioned and validated before persistence",async()=>{
  const [document,service]=await Promise.all([source("src/website/page-document.ts"),source("src/website/service.ts")]);
  assert.match(document,/PAGE_DOCUMENT_SCHEMA_VERSION = 2/);
  assert.match(document,/Duplicate component id/);
  assert.match(document,/at most 100 items/);
  assert.match(service,/validatePageDocument\(input\.document\)/);
  assert.match(service,/parsePageDocument\(draft\.document_json\)/);
});

test("page lifecycle keeps draft and live versions isolated",async()=>{
  const service=await source("src/website/service.ts");
  for(const operation of ["createPage","duplicatePage","saveDraft","publishPage","unpublishPage","deletePage"]){assert.match(service,new RegExp(`function ${operation}`));}
  assert.match(service,/state='draft'/);
  assert.match(service,/state='published'/);
  assert.match(service,/published row is an immutable snapshot/);
  assert.match(service,/PageDocumentValidationError|validatePageDocument/);
});

test("page history rollback restores only the draft and remains tenant scoped",async()=>{
  const [service,historyRoute,rollbackRoute,authorization]=await Promise.all([
    source("src/website/service.ts"),
    source("app/api/pages/[pageId]/versions/route.ts"),
    source("app/api/pages/[pageId]/rollback/route.ts"),
    source("src/website/authorization.ts"),
  ]);
  assert.match(service,/function listPageVersions/);
  assert.match(service,/function rollbackPage/);
  assert.match(service,/WHERE id=\? AND page_id=\?/);
  assert.match(service,/UPDATE page_versions SET document_json=.*state='draft'/);
  assert.doesNotMatch(service.slice(service.indexOf("export async function rollbackPage"),service.indexOf("export async function saveDraft")),/published_version_id\s*=/);
  assert.match(historyRoute,/authorizeWebsite\("pages\.read"\)/);
  assert.match(rollbackRoute,/authorizeWebsite\("pages\.write"\)/);
  assert.match(rollbackRoute,/page\.rolled_back/);
  assert.match(authorization,/requireAnyServiceEntitlement/);
});

test("domains and assets are workspace-owned website resources",async()=>{
  const [resources,domains,assets]=await Promise.all([
    source("src/website/resources.ts"),
    source("app/api/site/domains/route.ts"),
    source("app/api/site/assets/route.ts"),
  ]);
  assert.match(resources,/WHERE workspace_id=\? AND status='active'/);
  assert.match(resources,/status:'pending'|status:"pending"/);
  assert.match(resources,/Asset is used by page SEO and cannot be deleted/);
  for(const route of [domains,assets]){
    assert.match(route,/authorizeWebsite/);
    assert.match(route,/writeAuditEvent/);
  }
});

test("the revised plan marks Phase 9 complete and leaves Phase 10 untouched",async()=>{
  const plan=await source("MODULO_REVISED_IMPLEMENTATION_PLAN.md");
  const phase5=plan.slice(plan.indexOf("# Phase 5"),plan.indexOf("# Phase 6"));
  const phase6=plan.slice(plan.indexOf("# Phase 6"),plan.indexOf("# Phase 7"));
  assert.match(phase5,/\*\*Status:\*\* Complete/);
  assert.match(phase5,/Completion record - 2026-08-31/);
  assert.match(phase6,/\*\*Status:\*\* Complete/);
  assert.match(phase6,/Completion record - 2026-09-01/);
  const phase7=plan.slice(plan.indexOf("# Phase 7"),plan.indexOf("# Phase 8"));
  assert.match(phase7,/\*\*Status:\*\* Complete/);
  assert.match(phase7,/Completion record - 2026-09-01/);
  const phase8=plan.slice(plan.indexOf("# Phase 8"),plan.indexOf("# Phase 9"));
  assert.match(phase8,/\*\*Status:\*\* Complete/);
  assert.match(phase8,/Completion record - 2026-09-01/);
  const phase9=plan.slice(plan.indexOf("# Phase 9"),plan.indexOf("# Phase 10"));
  assert.match(phase9,/\*\*Status:\*\* Complete/);
  assert.match(phase9,/Completion record - 2026-09-01/);
  const phase10=plan.slice(plan.indexOf("# Phase 10"),plan.indexOf("# Phase 11"));
  assert.match(phase10,/\*\*Status:\*\* Not started/);
});

test("public resolution serves published content unless a valid preview token is supplied",async()=>{
  const [service,worker,publicRoute]=await Promise.all([source("src/website/service.ts"),source("worker/index.ts"),source("app/api/public/[slug]/route.ts")]);
  assert.match(service,/published_version_id/);
  assert.match(service,/site_preview_tokens/);
  assert.match(service,/versionId=page\.draft_version_id/);
  assert.match(worker,/d\.status='verified'/);
  assert.match(worker,/d\.verified_at IS NOT NULL/);
  assert.match(worker,/site_redirects/);
  assert.match(publicRoute,/resolvePublicPage/);
});

test("navigation SEO redirects and one shared renderer are wired",async()=>{
  const [navigation,redirects,renderer]=await Promise.all([source("app/api/site/navigation/route.ts"),source("app/api/site/redirects/route.ts"),source("components/platform/public-site.tsx")]);
  assert.match(navigation,/parent_id/);
  assert.match(redirects,/statusCode/);
  assert.match(renderer,/data\.page\.seo/);
  assert.match(renderer,/data\.workspace\.mode/);
  assert.match(renderer,/parentId/);
});

test("legacy pages migrate into isolated draft and published snapshots",async()=>{
  const migration=await source("drizzle/0010_website_engine.sql");
  const script=`
import json,sqlite3,sys
p=json.load(sys.stdin);db=sqlite3.connect(':memory:')
db.executescript("""
CREATE TABLE users(id TEXT PRIMARY KEY);
CREATE TABLE workspaces(id TEXT PRIMARY KEY,name TEXT,created_at INTEGER,updated_at INTEGER);
CREATE TABLE workspace_capabilities(workspace_id TEXT,capability TEXT,enabled_at INTEGER);
CREATE TABLE pages(id TEXT PRIMARY KEY,workspace_id TEXT,slug TEXT,title TEXT,status TEXT,sections_json TEXT,updated_at INTEGER);
CREATE TABLE custom_domains(id TEXT PRIMARY KEY,workspace_id TEXT,hostname TEXT,status TEXT,created_at INTEGER);
INSERT INTO workspaces VALUES ('w','Studio',1,2);
INSERT INTO pages VALUES ('draft','w','home','Home','draft','[]',2),('live','w','about','About','published','[]',3);
INSERT INTO custom_domains VALUES ('d','w','studio.example','verified',2);
""")
db.executescript(p['migration'].replace('--> statement-breakpoint',''))
out={'sites':db.execute('SELECT COUNT(*) FROM sites').fetchone()[0],
'drafts':db.execute("SELECT COUNT(*) FROM page_versions WHERE state='draft'").fetchone()[0],
'published':db.execute("SELECT COUNT(*) FROM page_versions WHERE state='published'").fetchone()[0],
'domain':db.execute('SELECT site_id,verified_at FROM custom_domains').fetchone(),
'live':db.execute("SELECT published_version_id FROM pages WHERE id='live'").fetchone()[0]}
print(json.dumps(out))`;
  const result=spawnSync("python3",["-c",script],{input:JSON.stringify({migration}),encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  const data=JSON.parse(result.stdout);
  assert.deepEqual({sites:data.sites,drafts:data.drafts,published:data.published},{sites:1,drafts:2,published:1});
  assert.ok(data.domain[0]);assert.equal(data.domain[1],2);assert.ok(data.live);
});
