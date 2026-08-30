import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { publishPage, unpublishPage } from "@/src/website/service";
import { writeAuditEvent } from "@/src/core/audit/service";
type Context={params:Promise<{pageId:string}>};
export async function POST(_:Request,{params}:Context){try{const ctx=await authorize("pages.publish"),pageId=(await params).pageId,result=await publishPage(env.DB,{workspaceId:ctx.workspace.id,pageId,actorUserId:ctx.user.id});await writeAuditEvent({workspaceId:ctx.workspace.id,actorUserId:ctx.user.id,action:"page.published",targetType:"page",targetId:pageId});return Response.json(result);}catch(error){return error instanceof Response?error:Response.json({error:error instanceof Error?error.message:"Unexpected error"},{status:500});}}
export async function DELETE(_:Request,{params}:Context){try{const ctx=await authorize("pages.publish"),pageId=(await params).pageId,result=await unpublishPage(env.DB,ctx.workspace.id,pageId);await writeAuditEvent({workspaceId:ctx.workspace.id,actorUserId:ctx.user.id,action:"page.unpublished",targetType:"page",targetId:pageId});return Response.json(result);}catch(error){return error instanceof Response?error:Response.json({error:error instanceof Error?error.message:"Unexpected error"},{status:500});}}
