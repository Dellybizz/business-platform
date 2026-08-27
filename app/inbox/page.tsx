import { Inbox } from "@/components/platform/inbox";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminShell } from "@/components/platform/admin-shell";
export const dynamic="force-dynamic";
export default async function InboxPage(){await requireChatGPTUser("/inbox");return <AdminShell><Inbox/></AdminShell>}
