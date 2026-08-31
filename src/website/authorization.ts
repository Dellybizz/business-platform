import { authorize } from "@/src/core/authorization/service";
import type { StaffPermission } from "@/src/core/authorization/permissions";
import { requireAnyServiceEntitlement } from "@/src/core/entitlements/service";

export const websiteServices = ["ecommerce_website", "business_showcase", "cv", "portfolio"] as const;

export async function authorizeWebsite(permission: StaffPermission) {
  return requireAnyServiceEntitlement(await authorize(permission), websiteServices);
}
