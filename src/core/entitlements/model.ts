import type { Capability, WorkspaceType } from "@/src/core/workspaces/model";

export const serviceProducts = [
  "ecommerce_website",
  "pos",
  "business_showcase",
  "cv",
  "portfolio",
] as const;

export type ServiceProduct = (typeof serviceProducts)[number];

export const entitlementStatuses = ["trial", "active", "suspended", "cancelled"] as const;
export type EntitlementStatus = (typeof entitlementStatuses)[number];

export type ServiceEntitlement = {
  service: ServiceProduct;
  status: EntitlementStatus;
  activatedAt: number;
  trialEndsAt: number | null;
  suspendedAt: number | null;
  cancelledAt: number | null;
  updatedAt: number;
};

export type ServiceProductDefinition = {
  label: string;
  description: string;
  workspaceTypes: readonly WorkspaceType[];
  capabilities: readonly Capability[];
  dashboardHref: string;
};

export const serviceCatalog: Record<ServiceProduct, ServiceProductDefinition> = {
  ecommerce_website: {
    label: "Ecommerce Website",
    description: "Online storefront, product publishing and checkout.",
    workspaceTypes: ["commerce_business"],
    capabilities: ["website", "catalog", "checkout"],
    dashboardHref: "/online-store",
  },
  pos: {
    label: "Point of Sale",
    description: "In-person sales, registers and location inventory.",
    workspaceTypes: ["commerce_business"],
    capabilities: ["catalog", "pos"],
    dashboardHref: "/pos",
  },
  business_showcase: {
    label: "Business Showcase",
    description: "Service website, enquiries, content and optional bookings.",
    workspaceTypes: ["business_showcase"],
    capabilities: ["website", "services", "bookings", "blog"],
    dashboardHref: "/site",
  },
  cv: {
    label: "CV Website",
    description: "Professional profile, experience and resume website.",
    workspaceTypes: ["cv"],
    capabilities: ["website", "portfolio"],
    dashboardHref: "/site",
  },
  portfolio: {
    label: "Portfolio Website",
    description: "Projects, case studies and professional portfolio.",
    workspaceTypes: ["portfolio"],
    capabilities: ["website", "portfolio", "blog"],
    dashboardHref: "/site",
  },
};

export const activeEntitlementStatuses: readonly EntitlementStatus[] = ["trial", "active"];

export function isServiceProduct(value: unknown): value is ServiceProduct {
  return typeof value === "string" && serviceProducts.includes(value as ServiceProduct);
}

export function isEntitlementStatus(value: unknown): value is EntitlementStatus {
  return typeof value === "string" && entitlementStatuses.includes(value as EntitlementStatus);
}

export function isUsableEntitlement(entitlement: Pick<ServiceEntitlement, "status" | "trialEndsAt">, now = Date.now()) {
  if (!activeEntitlementStatuses.includes(entitlement.status)) return false;
  return entitlement.status !== "trial" || entitlement.trialEndsAt === null || entitlement.trialEndsAt > now;
}

export function hasUsableService(entitlements: readonly ServiceEntitlement[], service: ServiceProduct, now = Date.now()) {
  const entitlement = entitlements.find((item) => item.service === service);
  return Boolean(entitlement && isUsableEntitlement(entitlement, now));
}

export function servicesForWorkspaceType(type: WorkspaceType): readonly ServiceProduct[] {
  return serviceProducts.filter((service) => serviceCatalog[service].workspaceTypes.includes(type));
}

export function defaultServicesForWorkspaceType(type: WorkspaceType): readonly ServiceProduct[] {
  if (type === "commerce_business") return [];
  return servicesForWorkspaceType(type);
}

export function capabilitiesForServices(services: readonly ServiceProduct[]): Capability[] {
  return [...new Set(services.flatMap((service) => serviceCatalog[service].capabilities))];
}
