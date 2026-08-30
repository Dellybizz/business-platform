/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Vinext's RSC child environment can expose a build-time snapshot through
    // `cloudflare:workers`. Bridge the bindings received by the actual Worker
    // request so server route handlers always see dashboard-managed secrets.
    const runtime = globalThis as typeof globalThis & {
      __MODULO_RUNTIME_ENV__?: Pick<Env, "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET">;
    };
    runtime.__MODULO_RUNTIME_ENV__ = {
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    };
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const platformHosts = new Set(["business.zanisheluxe.in", "business-platform.habeebaasif622.workers.dev"]);
    const isInternalPath = url.pathname.startsWith("/api/") || url.pathname.startsWith("/_") || url.pathname.startsWith("/s/") || url.pathname === "/favicon.ico";
    if (!platformHosts.has(url.hostname) && !isInternalPath) {
      const domain = await env.DB.prepare(`SELECT w.slug,s.id AS siteId FROM custom_domains d JOIN sites s ON s.id=d.site_id JOIN workspaces w ON w.id=s.workspace_id WHERE d.hostname=? AND d.status='verified' AND d.verified_at IS NOT NULL AND s.status='active'`).bind(url.hostname).first<{slug:string;siteId:string}>();
      if (domain) {
        const redirect = await env.DB.prepare("SELECT destination,status_code AS statusCode FROM site_redirects WHERE site_id=? AND source_path=?").bind(domain.siteId,url.pathname).first<{destination:string;statusCode:number}>();
        if (redirect) return Response.redirect(new URL(redirect.destination, url), redirect.statusCode === 302 ? 302 : 301);
        url.pathname = `/s/${domain.slug}${url.pathname === "/" ? "" : url.pathname}`;
        request = new Request(url, request);
      }
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
