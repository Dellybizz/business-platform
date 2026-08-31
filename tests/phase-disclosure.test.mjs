import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("unfinished components disclose their actual delivery phase",async()=>{
  const badge=await read("components/platform/phase-delivery-badge.tsx");
  const builder=await read("components/platform/website-builder.tsx");
  const modules=await read("components/platform/admin-module-page.tsx");
  const dashboard=await read("components/platform/dashboard.tsx");
  assert.match(badge,/Planned for Phase/);
  assert.match(builder,/PhaseDeliveryBadge phase=\{8\}/);
  assert.match(builder,/disabled variant="outline"/);
  assert.match(modules,/PhaseDeliveryBadge phase=\{15\}/);
  assert.match(modules,/PhaseDeliveryBadge phase=\{16\}/);
  assert.match(dashboard,/PhaseDeliveryBadge phase=\{17\}/);
});

test("the plan defines disclosure without starting a later phase",async()=>{
  const plan=await read("MODULO_REVISED_IMPLEMENTATION_PLAN.md");
  assert.match(plan,/Current development snapshot and unfinished-component disclosure/);
  assert.match(plan,/Completed components must not display the badge/);
  assert.match(plan,/# Phase 6[\s\S]*?\*\*Status:\*\* Not started/);
});
