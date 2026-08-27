import { PublicSite } from "@/components/platform/public-site";
import { env } from "cloudflare:workers";
import { themeStyle } from "@/lib/themes/registry";
export default async function PublicSitePage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const workspace=await env.DB.prepare("SELECT theme_id AS themeId FROM workspaces WHERE slug = ?").bind(slug).first<{themeId:string}>();return <div className="tenant-theme" style={themeStyle(workspace?.themeId)}><PublicSite slug={slug}/></div>}
