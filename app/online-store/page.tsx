import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminShell } from "@/components/platform/admin-shell";
import { AdminModulePage } from "@/components/platform/admin-module-page";
export const dynamic = "force-dynamic";
export default async function OnlineStorePage(){ await requireChatGPTUser("/online-store"); return <AdminShell><AdminModulePage module="online-store"/></AdminShell>; }
