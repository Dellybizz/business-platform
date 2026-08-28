import { getTemporaryPublicOwner } from "@/src/core/identity/temporary-public-owner";

export type ChatGPTUser = { displayName: string; email: string; fullName: string | null };

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  return getTemporaryPublicOwner();
}

export async function requireChatGPTUser(returnTo: string) {
  void returnTo;
  return (await getChatGPTUser())!;
}

export function chatGPTSignInPath(returnTo: string) {
  return safeRelativeReturnPath(returnTo);
}

export function chatGPTSignOutPath(returnTo = "/") {
  return safeRelativeReturnPath(returnTo);
}

function safeRelativeReturnPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local" || url.pathname === "/login" || url.pathname.startsWith("/api/auth/")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
