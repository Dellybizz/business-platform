import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { deletePage, readDraftPage, saveDraft } from "@/src/website/service";
import { PageDocumentValidationError } from "@/src/website/page-document";
import { writeAuditEvent } from "@/src/core/audit/service";
type Context={params:Promise<{pageId:string}>};
export async function GET(_:Request,{params}:Context){try{const ctx=await authorize("pages.read");return Response.json({page:await readDraftPage(env.DB,ctx.workspace.id,(await params).pageId)});}catch(error){return fail(error);}}
export async function PATCH(request:Request,{params}:Context){try{const ctx=await authorize("pages.write"),body=await request.json() as Parameters<typeof saveDraft>[1],pageId=(await params).pageId;const result=await saveDraft(env.DB,{...body,workspaceId:ctx.workspace.id,pageId,actorUserId:ctx.user.id});await writeAuditEvent({workspaceId:ctx.workspace.id,actorUserId:ctx.user.id,action:"page.draft_saved",targetType:"page",targetId:pageId});return Response.json(result);}catch(error){return fail(error);}}
export async function DELETE(_:Request,{params}:Context){try{const ctx=await authorize("pages.write"),pageId=(await params).pageId,result=await deletePage(env.DB,ctx.workspace.id,pageId);await writeAuditEvent({workspaceId:ctx.workspace.id,actorUserId:ctx.user.id,action:"page.deleted",targetType:"page",targetId:pageId});return Response.json(result);}catch(error){return fail(error);}}
function fail(error:unknown){if(error instanceof Response)return error;if(error instanceof PageDocumentValidationError)return Response.json({error:error.message},{status:400});return Response.json({error:error instanceof Error?error.message:"Unexpected error"},{status:500});}
