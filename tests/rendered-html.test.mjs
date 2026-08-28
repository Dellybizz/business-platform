import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("embeds development preview metadata in the production Worker", async () => {
  // The generated bundle retains `cloudflare:*` runtime imports and therefore
  // must not be executed by Node. Runtime HTTP checks run through Wrangler or
  // the deployed Worker; this post-build contract validates the emitted bundle.
  const worker = await readFile(
    new URL("../dist/server/index.js", import.meta.url),
    "utf8",
  );

  assert.match(worker, /["']codex-preview["']\s*:\s*["']development["']/);
  assert.match(worker, /fetch\s*\(/);
});
