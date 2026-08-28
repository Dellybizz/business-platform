export const staffRoles = [
  "owner",
  "administrator",
  "website_editor",
  "store_manager",
  "pos_manager",
  "pos_staff",
  "support_viewer",
] as const;

export type StaffRole = (typeof staffRoles)[number];

export const platformRoles = ["platform_owner"] as const;
export type PlatformRole = (typeof platformRoles)[number];

export const platformPermissions = [
  "platform.manage",
  "platform.audit.read",
  "platform.support.access",
] as const;
export type PlatformPermission = (typeof platformPermissions)[number];

export const staffPermissions = [
  "workspace.read",
  "workspace.update",
  "members.read",
  "members.invite",
  "members.manage",
  "content.read",
  "content.write",
  "content.delete",
  "pages.read",
  "pages.write",
  "pages.publish",
  "submissions.read",
  "submissions.write",
  "settings.write",
  "capabilities.write",
  "audit.read",
  "pos.sell",
  "pos.manage",
] as const;

export type StaffPermission = (typeof staffPermissions)[number];

export const rolePermissionMap: Record<StaffRole, readonly StaffPermission[]> = {
  owner: staffPermissions,
  administrator: staffPermissions.filter((permission) => permission !== "pos.sell"),
  website_editor: ["workspace.read", "content.read", "content.write", "pages.read", "pages.write", "pages.publish"],
  store_manager: ["workspace.read", "content.read", "content.write", "content.delete", "submissions.read", "submissions.write"],
  pos_manager: ["workspace.read", "content.read", "submissions.read", "pos.sell", "pos.manage"],
  pos_staff: ["workspace.read", "content.read", "pos.sell"],
  support_viewer: ["workspace.read", "members.read", "content.read", "pages.read", "submissions.read", "audit.read"],
};

export const pluginPermissionScopes = {
  "catalog:read": "Read published catalog data through CatalogService",
  "catalog:write": "Create or update catalog data through CatalogService",
  "orders:read": "Read orders through OrderService",
  "orders:write": "Create or update orders through OrderService",
  "customers:read": "Read customer profiles through CustomerService",
  "customers:write": "Create or update customer profiles through CustomerService",
  "website:read": "Read site and page documents through Website services",
  "website:write": "Create or update draft website content through Website services",
} as const;

export type PluginPermissionScope = keyof typeof pluginPermissionScopes;

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && staffRoles.includes(value as StaffRole);
}
