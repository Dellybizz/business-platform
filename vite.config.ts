import vinext from "vinext";
import { defineConfig } from "vite";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

// External Cloudflare builds can provide their own D1 database while the
// managed Sites deployment keeps using its platform-provided binding.
const externalD1DatabaseId =
  process.env.CLOUDFLARE_D1_DATABASE_ID ??
  SITE_CREATOR_PLACEHOLDER_DATABASE_ID;

const hostingConfigPath = resolve(process.cwd(), ".openai", "hosting.json");
const hostingConfig = existsSync(hostingConfigPath)
  ? (JSON.parse(readFileSync(hostingConfigPath, "utf8")) as {
      d1?: string | null;
      r2?: string | null;
    })
  : { d1: "DB", r2: null };

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  // Dashboard-managed secret values remain encrypted. Declaring their names
  // makes the generated Wrangler config validate and expose the bindings to
  // the Vinext RSC and SSR Worker environments.
  secrets: {
    required: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name:
            process.env.CLOUDFLARE_D1_DATABASE_NAME ?? "site-creator-d1",
          database_id: externalD1DatabaseId,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
