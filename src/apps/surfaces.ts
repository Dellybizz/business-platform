export const applicationSurfaceIds = [
  "marketing-site",
  "merchant-admin",
  "platform-admin",
  "visual-editor",
  "pos",
  "storefront",
  "portals",
] as const;

export type ApplicationSurfaceId = (typeof applicationSurfaceIds)[number];

export type ApplicationSurface = {
  id: ApplicationSurfaceId;
  audience: "public" | "merchant" | "platform-operator" | "staff" | "customer";
  responsibility: string;
};

export const applicationSurfaces: readonly ApplicationSurface[] = [
  { id: "marketing-site", audience: "public", responsibility: "Discovery, pricing and workspace onboarding" },
  { id: "merchant-admin", audience: "merchant", responsibility: "Workspace operations and settings" },
  { id: "platform-admin", audience: "platform-operator", responsibility: "Tenant, billing, deployment and platform operations" },
  { id: "visual-editor", audience: "merchant", responsibility: "Draft page composition, preview and publishing" },
  { id: "pos", audience: "staff", responsibility: "Location-bound in-person sales" },
  { id: "storefront", audience: "public", responsibility: "Published commerce and content rendering" },
  { id: "portals", audience: "customer", responsibility: "Customer, affiliate and other external self-service" },
] as const;

