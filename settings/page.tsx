import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminShell } from "@/components/platform/admin-shell";
import { SettingsPanel } from "@/components/platform/settings-panel";
export const dynamic="force-dynamic";
export default async function SettingsPage(){await requireChatGPTUser("/settings");return <AdminShell><SettingsPanel/></AdminShell>}
