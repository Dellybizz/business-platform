import { ContentManager } from "@/components/platform/content-manager";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminShell } from "@/components/platform/admin-shell";
export const dynamic="force-dynamic";
export default async function ContentPage(){await requireChatGPTUser("/content");return <AdminShell><ContentManager/></AdminShell>}
