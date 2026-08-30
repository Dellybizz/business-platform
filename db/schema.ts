import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  emailVerifiedAt: integer("email_verified_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
});

export const accountRecoveryTokens = sqliteTable("account_recovery_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  mode: text("mode").notNull().default("store"),
  workspaceType: text("workspace_type").notNull().default("business_showcase"),
  businessCategory: text("business_category"),
  onboardingKey: text("onboarding_key").unique(),
  themeId: text("theme_id").notNull().default("atelier"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const workspaceCapabilities = sqliteTable(
  "workspace_capabilities",
  {
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    capability: text("capability").notNull(),
    enabledAt: integer("enabled_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("workspace_capabilities_workspace_capability_unique").on(table.workspaceId, table.capability)],
);

export const workspaceServiceEntitlements = sqliteTable(
  "workspace_service_entitlements",
  {
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    service: text("service").notNull(),
    status: text("status").notNull().default("active"),
    activatedAt: integer("activated_at", { mode: "timestamp_ms" }).notNull(),
    trialEndsAt: integer("trial_ends_at", { mode: "timestamp_ms" }),
    suspendedAt: integer("suspended_at", { mode: "timestamp_ms" }),
    cancelledAt: integer("cancelled_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("workspace_service_entitlements_workspace_service_unique").on(table.workspaceId, table.service)],
);

export const customDomains = sqliteTable("custom_domains", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  hostname: text("hostname").notNull().unique(),
  status: text("status").notNull().default("pending"),
  siteId: text("site_id"),
  verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("sites_workspace_unique").on(table.workspaceId)]);

export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  role: text("role").notNull().default("owner"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("memberships_user_workspace_unique").on(table.userId, table.workspaceId)]);

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  scope: text("scope").notNull().default("workspace"),
});

export const platformMemberships = sqliteTable("platform_memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("platform_owner"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("platform_memberships_user_unique").on(table.userId)]);

export const rolePermissions = sqliteTable("role_permissions", {
  roleId: text("role_id").notNull().references(() => roles.id),
  permission: text("permission").notNull(),
}, (table) => [uniqueIndex("role_permissions_role_permission_unique").on(table.roleId, table.permission)]);

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  invitedBy: text("invited_by").notNull().references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").references(() => workspaces.id),
  actorUserId: text("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const staffPinCredentials = sqliteTable("staff_pin_credentials", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  userId: text("user_id").notNull().references(() => users.id),
  pinHash: text("pin_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  disabledAt: integer("disabled_at", { mode: "timestamp_ms" }),
}, (table) => [uniqueIndex("staff_pin_workspace_user_unique").on(table.workspaceId, table.userId)]);

export const pluginPermissionScopes = sqliteTable("plugin_permission_scopes", {
  scope: text("scope").primaryKey(),
  description: text("description").notNull(),
});

export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  sectionsJson: text("sections_json").notNull().default("[]"),
  siteId: text("site_id").references(() => sites.id),
  pageType: text("page_type").notNull().default("standard"),
  templateKey: text("template_key"),
  draftVersionId: text("draft_version_id"),
  publishedVersionId: text("published_version_id"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  canonicalUrl: text("canonical_url"),
  socialImageAssetId: text("social_image_asset_id"),
  indexable: integer("indexable", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("pages_site_slug_unique").on(table.siteId, table.slug)]);

export const pageVersions = sqliteTable("page_versions", {
  id: text("id").primaryKey(),
  pageId: text("page_id").notNull().references(() => pages.id),
  versionNumber: integer("version_number").notNull(),
  state: text("state").notNull().default("draft"),
  schemaVersion: integer("schema_version").notNull().default(1),
  documentJson: text("document_json").notNull(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
}, (table) => [uniqueIndex("page_versions_page_number_unique").on(table.pageId, table.versionNumber)]);

export const navigationMenus = sqliteTable("navigation_menus", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  handle: text("handle").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("navigation_menus_site_handle_unique").on(table.siteId, table.handle)]);

export const navigationMenuItems = sqliteTable("navigation_menu_items", {
  id: text("id").primaryKey(),
  menuId: text("menu_id").notNull().references(() => navigationMenus.id),
  parentId: text("parent_id"),
  label: text("label").notNull(),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const siteRedirects = sqliteTable("site_redirects", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  sourcePath: text("source_path").notNull(),
  destination: text("destination").notNull(),
  statusCode: integer("status_code").notNull().default(301),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("site_redirects_site_source_unique").on(table.siteId, table.sourcePath)]);

export const siteAssets = sqliteTable("site_assets", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  altText: text("alt_text").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sitePreviewTokens = sqliteTable("site_preview_tokens", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  pageId: text("page_id").references(() => pages.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
});

export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  type: text("type").notNull(),
  itemId: text("item_id"),
  itemTitle: text("item_title").notNull().default("General enquiry"),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
