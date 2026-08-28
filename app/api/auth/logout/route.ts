import { revokeCurrentSession } from "@/src/core/identity/session";

export async function POST() {
  await revokeCurrentSession();
  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  await revokeCurrentSession();
  const target = new URL(request.url).searchParams.get("returnTo");
  const safe = target?.startsWith("/") && !target.startsWith("//") ? target : "/";
  return Response.redirect(new URL(safe, request.url), 303);
}
