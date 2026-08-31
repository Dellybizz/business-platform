import { env } from "cloudflare:workers";
import { authorizeWebsite } from "@/src/website/authorization";
import { writeAuditEvent } from "@/src/core/audit/service";
import { rollbackPage } from "@/src/website/service";
type Context={params:Promise<{pageId:string}>};
export async function POST(request:Request,{params}:Context){try{const ctx=await authorizeWebsite("pages.write"),pageId=(await params).pageId,body=await request.json() as{versionId?:string};if(!body.versionId)return Response.json({error:"Version is required"},{status:400});const result=await rollbackPage(env.DB,{workspaceId:ctx.workspace.id,pageId,versionId:body.versionId,actorUserId:ctx.user.id});await writeAuditEvent({workspaceId:ctx.workspace.id,actorUserId:ctx.user.id,action:"page.rolled_back",targetType:"page",targetId:pageId,metadata:{versionId:body.versionId}});return Response.json(result);}catch(error){return error instanceof Response?error:Response.json({error:error instanceof Error?error.message:"Unexpected error"},{status:500});}}
