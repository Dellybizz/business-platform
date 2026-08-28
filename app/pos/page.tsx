import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminShell } from "@/components/platform/admin-shell";
import { AdminModulePage } from "@/components/platform/admin-module-page";
export const dynamic = "force-dynamic";
export default async function PosPage(){ await requireChatGPTUser("/pos"); return <AdminShell><AdminModulePage module="pos"/></AdminShell>; }
