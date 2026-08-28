import { getSessionUser } from "@/src/core/identity/session";

export async function GET() {
  const user = await getSessionUser();
  return user ? Response.json({ user }) : Response.json({ error: "Authentication required" }, { status: 401 });
}
