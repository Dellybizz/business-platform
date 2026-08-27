import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { ThemeGallery } from "@/components/platform/theme-gallery";
import { AdminShell } from "@/components/platform/admin-shell";
export const dynamic="force-dynamic";
export default async function ThemesPage(){await requireChatGPTUser("/themes");return <AdminShell><ThemeGallery/></AdminShell>}
