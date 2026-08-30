import { AdminShell } from "@/components/platform/admin-shell";
import { AdminModulePage } from "@/components/platform/admin-module-page";
import { requireTenant } from "@/lib/auth/tenant";
import { requireServiceEntitlement } from "@/src/core/entitlements/service";
export const dynamic = "force-dynamic";
export default async function OnlineStorePage(){ requireServiceEntitlement(await requireTenant(), "ecommerce_website"); return <AdminShell><AdminModulePage module="online-store"/></AdminShell>; }
