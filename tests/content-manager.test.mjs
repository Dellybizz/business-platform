import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("content manager derives its mode from the current workspace contract",async()=>{
 const source=await readFile(new URL("../components/platform/content-manager.tsx",import.meta.url),"utf8");
 assert.match(source,/capabilities\?\.includes\("catalog"\)/);
 assert.match(source,/capabilities\?\.includes\("services"\)/);
 assert.doesNotMatch(source,/setMode\(d\.mode\)/);
});

test("content manager renders recoverable loading and API error states",async()=>{
 const source=await readFile(new URL("../components/platform/content-manager.tsx",import.meta.url),"utf8");
 assert.match(source,/if\(!response\.ok\)throw new Error/);
 assert.match(source,/role="alert"/);
 assert.match(source,/Loading \{copy\.many\.toLowerCase\(\)\}/);
});
