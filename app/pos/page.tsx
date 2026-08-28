import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AdminShell } from "@/components/platform/admin-shell";
import { AdminModulePage } from "@/components/platform/admin-module-page";
import { requireTenant } from "@/lib/auth/tenant";
import { requireServiceEntitlement } from "@/src/core/entitlements/service";
export const dynamic = "force-dynamic";
export default async function PosPage(){ await requireChatGPTUser("/pos"); requireServiceEntitlement(await requireTenant(), "pos"); return <AdminShell><AdminModulePage module="pos"/></AdminShell>; }
