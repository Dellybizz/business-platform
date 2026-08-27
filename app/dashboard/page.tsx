import { Dashboard } from "@/components/platform/dashboard";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminShell } from "@/components/platform/admin-shell";
export const dynamic="force-dynamic";
export default async function DashboardPage(){await requireChatGPTUser("/dashboard");return <AdminShell><Dashboard/></AdminShell>}
