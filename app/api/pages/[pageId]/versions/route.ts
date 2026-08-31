import { env } from "cloudflare:workers";
import { authorizeWebsite } from "@/src/website/authorization";
import { listPageVersions } from "@/src/website/service";
type Context={params:Promise<{pageId:string}>};
export async function GET(_:Request,{params}:Context){try{const ctx=await authorizeWebsite("pages.read");return Response.json({versions:await listPageVersions(env.DB,ctx.workspace.id,(await params).pageId)});}catch(error){return error instanceof Response?error:Response.json({error:error instanceof Error?error.message:"Unexpected error"},{status:500});}}
