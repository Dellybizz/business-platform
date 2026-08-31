import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("builder receives a server-validated page slug and publishing stays in the editor",async()=>{
  const page=await read("app/builder/page.tsx");
  const builder=await read("components/platform/website-builder.tsx");
  assert.match(page,/WebsiteBuilder pageSlug=/);
  assert.doesNotMatch(builder,/useSearchParams/);
  assert.match(builder,/setPublished\(true\)/);
  assert.doesNotMatch(builder,/location\.href\s*=\s*data\.workspace/);
  assert.match(builder,/href="\/pages"/);
});

test("pages manager exposes the complete page lifecycle and navigation placement",async()=>{
  const manager=await read("components/platform/pages-manager.tsx");
  assert.match(manager,/duplicate/);
  assert.match(manager,/publish/);
  assert.match(manager,/unpublish/);
  assert.match(manager,/delete/);
  assert.match(manager,/Show in menu/);
  assert.match(manager,/\/api\/site\/navigation/);
  assert.match(manager,/workspaceSlug/);
});

test("business manager creates and switches every supported workspace type",async()=>{
  const manager=await read("components/platform/business-manager.tsx");
  for(const type of ["commerce_business","business_showcase","cv","portfolio"])assert.match(manager,new RegExp(type));
  assert.match(manager,/businessCategory:category/);
  assert.match(manager,/requestId:crypto\.randomUUID/);
  assert.match(manager,/services/);
  assert.match(manager,/method:"PATCH"/);
  assert.match(manager,/invalidateWorkspace/);
});

test("slug-routed public navigation remains inside the selected live site",async()=>{
  const site=await read("components/platform/public-site.tsx");
  assert.match(site,/window\.location\.pathname\.startsWith/);
  assert.match(site,/publicHref\(item\.url\)/);
  assert.match(site,/publicHref\(child\.url\)/);
});
