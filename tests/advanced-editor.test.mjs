import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { spawnSync } from "node:child_process";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const run = (code) => spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", code], { encoding: "utf8" });

test("advanced users can reorder structures and synchronize reusable global sections", () => {
  const code = `import {moveSection,saveReusableSection,insertReusableSection,synchronizeGlobalSection,reusableSections} from './lib/editor/advanced-editor.ts';let d={schemaVersion:2,editorMode:'advanced',dataSources:{},globalTokens:{},sections:[{id:'a',type:'hero',settings:{},blocks:[]},{id:'b',type:'callout',settings:{},blocks:[]}]};d=moveSection(d,'b','a');d=saveReusableSection(d,'b','Shared callout');d=insertReusableSection(d,reusableSections(d)[0].id);const changed={...d.sections[0],settings:{...d.sections[0].settings,heading:'Synced'}};d=synchronizeGlobalSection(d,changed);console.log(JSON.stringify([d.sections.map(s=>s.type),d.sections.filter(s=>s.settings.heading==='Synced').length,reusableSections(d).length]));`;
  const result = run(code);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), [["callout", "hero", "callout"], 2, 1]);
});

test("responsive controls generate isolated desktop tablet and mobile output", () => {
  const code = `import {responsiveStyleSheet,updateResponsiveStyles} from './lib/editor/advanced-editor.ts';let s={id:'hero_1',type:'hero',settings:{},blocks:[]};s=updateResponsiveStyles(s,'mobile',{hidden:true,paddingTop:12});s=updateResponsiveStyles(s,'tablet',{layout:'grid',columns:2});console.log(responsiveStyleSheet([s]));`;
  const result = run(code);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /max-width: 639px/);
  assert.match(result.stdout, /display:none!important/);
  assert.match(result.stdout, /max-width: 1023px/);
  assert.match(result.stdout, /grid-template-columns:repeat\(2/);
});

test("custom CSS is scoped and unsafe CSS is rejected on the server path", () => {
  const code = `import {sanitizeCustomCss} from './lib/editor/advanced-editor.ts';const safe=sanitizeCustomCss('.hero { color: red; padding-top: 10px; position: fixed }');let blocked=false;try{sanitizeCustomCss('@import url(https://bad.example/x.css);')}catch{blocked=true}console.log(JSON.stringify([safe,blocked]));`;
  const result = run(code);
  assert.equal(result.status, 0, result.stderr);
  const [safe, blocked] = JSON.parse(result.stdout);
  assert.match(safe, /^\.modulo-site \.hero/);
  assert.doesNotMatch(safe, /position/);
  assert.equal(blocked, true);
});

test("visual editor exposes page tree templates app blocks drag controls and mobile fallbacks", async () => {
  const [builder, blocks, appBlock, publicSite, route] = await Promise.all([read("components/platform/website-builder.tsx"), read("components/platform/block-editor.tsx"), read("lib/builder/blocks/app-slot.tsx"), read("components/platform/public-site.tsx"), read("app/api/public/[slug]/route.ts")]);
  assert.match(builder, /Page tree/);
  for (const label of ["Product page", "Collection page", "Standard page"]) assert.match(builder, new RegExp(label));
  assert.match(builder, /draggable/);
  assert.match(blocks, /draggable/);
  assert.match(builder, /Mobile editor tools/);
  assert.match(builder, /Save as reusable\/global section/);
  assert.match(appBlock, /storefront\.section/);
  assert.match(publicSite, /responsiveStyleSheet/);
  assert.match(route, /globalTokens/);
});

test("template replacement uses the recoverable Phase 8 backup endpoint", async () => {
  const [builder, route, service] = await Promise.all([read("components/platform/website-builder.tsx"), read("app/api/pages/[pageId]/layout/route.ts"), read("src/website/service.ts")]);
  assert.match(builder, /\/layout/);
  assert.match(route, /replacePageLayout/);
  assert.match(service, /"layout-replacement"/);
});
