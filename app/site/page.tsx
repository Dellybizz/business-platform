import { WebsiteOverview } from "@/components/platform/website-overview";
import { AdminShell } from "@/components/platform/admin-shell";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
export const dynamic="force-dynamic";
export default async function SitePage(){await requireChatGPTUser("/site");return <AdminShell><WebsiteOverview/></AdminShell>}
