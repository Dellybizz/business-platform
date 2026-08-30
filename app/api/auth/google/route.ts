export function GET(request: Request) {
  const source = new URL(request.url);
  const target = new URL("/auth/google", source.origin);
  const returnTo = source.searchParams.get("returnTo");
  if (returnTo) target.searchParams.set("returnTo", returnTo);
  return Response.redirect(target, 303);
}
