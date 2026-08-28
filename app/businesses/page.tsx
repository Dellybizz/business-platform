import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { BusinessManager } from "@/components/platform/business-manager";
import { AdminShell } from "@/components/platform/admin-shell";
export const dynamic="force-dynamic";
export default async function BusinessesPage(){await requireChatGPTUser("/businesses");return <AdminShell><BusinessManager/></AdminShell>}
