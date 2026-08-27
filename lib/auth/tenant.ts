import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export type TenantContext={user:{id:string;email:string;displayName:string};workspace:{id:string;name:string;mode:string;slug:string;themeId:string};role:string};
const ACTIVE_WORKSPACE_COOKIE="modulo_workspace";

export async function ensureUser(){
 const identity=await getChatGPTUser();
 if(!identity)throw new Response("Authentication required",{status:401});
 let user=await env.DB.prepare("SELECT id, email, display_name AS displayName FROM users WHERE email = ?").bind(identity.email).first<{id:string;email:string;displayName:string}>();
 if(!user){const id=crypto.randomUUID();await env.DB.prepare("INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)").bind(id,identity.email,identity.displayName,Date.now()).run();user={id,email:identity.email,displayName:identity.displayName}}
 return user;
}

export async function requireTenant():Promise<TenantContext>{
 const user=await ensureUser();
 let memberships=await env.DB.prepare("SELECT m.workspace_id AS workspaceId, m.role, w.name, w.mode, w.slug, w.theme_id AS themeId FROM memberships m JOIN workspaces w ON w.id = m.workspace_id WHERE m.user_id = ? ORDER BY m.created_at").bind(user.id).all<{workspaceId:string;role:string;name:string;mode:string;slug:string|null;themeId:string}>();
 if(!memberships.results.length){const claimed=await env.DB.prepare("SELECT COUNT(*) AS total FROM memberships").first<{total:number}>();const legacy=Number(claimed?.total||0)===0?await env.DB.prepare("SELECT id, name, mode FROM workspaces WHERE id = 'demo-workspace'").first<{id:string;name:string;mode:string}>():null;if(legacy){await env.DB.prepare("INSERT INTO memberships (id, user_id, workspace_id, role, created_at) VALUES (?, ?, ?, 'owner', ?)").bind(crypto.randomUUID(),user.id,legacy.id,Date.now()).run();memberships=await env.DB.prepare("SELECT m.workspace_id AS workspaceId, m.role, w.name, w.mode, w.slug, w.theme_id AS themeId FROM memberships m JOIN workspaces w ON w.id = m.workspace_id WHERE m.user_id = ?").bind(user.id).all()} }
 const selected=(await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
 const membership=memberships.results.find(x=>x.workspaceId===selected)??memberships.results[0];
 if(!membership)throw new Response("Create a workspace first",{status:409});
 let slug=membership.slug;if(!slug){slug=makeWorkspaceSlug(membership.name,membership.workspaceId);await env.DB.prepare("UPDATE workspaces SET slug = ? WHERE id = ?").bind(slug,membership.workspaceId).run()}
 return{user,workspace:{id:membership.workspaceId,name:membership.name,mode:membership.mode,slug,themeId:membership.themeId||"atelier"},role:membership.role};
}

export async function listUserWorkspaces(userId:string){const result=await env.DB.prepare("SELECT w.id, w.name, w.mode, w.slug, w.theme_id AS themeId, m.role FROM memberships m JOIN workspaces w ON w.id = m.workspace_id WHERE m.user_id = ? ORDER BY w.created_at").bind(userId).all();return result.results}
export async function selectWorkspace(workspaceId:string,userId:string){const allowed=await env.DB.prepare("SELECT id FROM memberships WHERE workspace_id = ? AND user_id = ?").bind(workspaceId,userId).first();if(!allowed)throw new Response("Workspace not found",{status:404});(await cookies()).set(ACTIVE_WORKSPACE_COOKIE,workspaceId,{httpOnly:true,sameSite:"lax",secure:true,path:"/",maxAge:31536000})}
export function makeWorkspaceSlug(name:string,id:string){return `${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,36)||"business"}-${id.slice(0,6)}`}
