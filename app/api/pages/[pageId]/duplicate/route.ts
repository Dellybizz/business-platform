import { env } from "cloudflare:workers";
import { authorizeWebsite } from "@/src/website/authorization";
import { duplicatePage } from "@/src/website/service";
import { writeAuditEvent } from "@/src/core/audit/service";
type Context={params:Promise<{pageId:string}>};
export async function POST(_:Request,{params}:Context){try{const ctx=await authorizeWebsite("pages.write"),sourceId=(await params).pageId,page=await duplicatePage(env.DB,{workspace:ctx.workspace,actorUserId:ctx.user.id,pageId:sourceId});await writeAuditEvent({workspaceId:ctx.workspace.id,actorUserId:ctx.user.id,action:"page.duplicated",targetType:"page",targetId:page.id,metadata:{sourceId}});return Response.json(page,{status:201});}catch(error){return error instanceof Response?error:Response.json({error:error instanceof Error?error.message:"Unexpected error"},{status:500});}}
