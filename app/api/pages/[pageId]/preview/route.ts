import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { createPreviewToken } from "@/src/website/service";
type Context={params:Promise<{pageId:string}>};
export async function POST(_:Request,{params}:Context){try{const ctx=await authorize("pages.read");return Response.json(await createPreviewToken(env.DB,{workspaceId:ctx.workspace.id,pageId:(await params).pageId,actorUserId:ctx.user.id}));}catch(error){return error instanceof Response?error:Response.json({error:error instanceof Error?error.message:"Unexpected error"},{status:500});}}
