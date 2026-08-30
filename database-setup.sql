PRAGMA foreign_keys = ON;

CREATE TABLE `workspaces` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `mode` text DEFAULT 'store' NOT NULL,
  `workspace_type` text DEFAULT 'business_showcase' NOT NULL,
  `business_category` text,
  `onboarding_key` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `slug` text,
  `theme_id` text DEFAULT 'atelier' NOT NULL
);

CREATE UNIQUE INDEX `workspaces_slug_unique` ON `workspaces` (`slug`);
CREATE UNIQUE INDEX `workspaces_onboarding_key_unique` ON `workspaces` (`onboarding_key`);

CREATE TABLE `workspace_capabilities` (
  `workspace_id` text NOT NULL,
  `capability` text NOT NULL,
  `enabled_at` integer NOT NULL,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`)
);

CREATE UNIQUE INDEX `workspace_capabilities_workspace_capability_unique`
  ON `workspace_capabilities` (`workspace_id`, `capability`);

CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `display_name` text NOT NULL,
  `password_hash` text,
  `email_verified_at` integer,
  `auth_provider` text,
  `auth_subject` text,
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX `users_auth_identity_unique` ON `users` (`auth_provider`, `auth_subject`);

CREATE TABLE `memberships` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `workspace_id` text NOT NULL,
  `role` text DEFAULT 'owner' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`)
);

CREATE UNIQUE INDEX `memberships_user_workspace_unique`
  ON `memberships` (`user_id`, `workspace_id`);

CREATE TABLE `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  `last_seen_at` integer NOT NULL,
  `revoked_at` integer,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);

CREATE TABLE `account_recovery_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `used_at` integer,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE UNIQUE INDEX `account_recovery_tokens_token_hash_unique`
  ON `account_recovery_tokens` (`token_hash`);

CREATE TABLE `roles` (`id` text PRIMARY KEY NOT NULL, `name` text NOT NULL, `scope` text DEFAULT 'workspace' NOT NULL);
CREATE TABLE `role_permissions` (
  `role_id` text NOT NULL,
  `permission` text NOT NULL,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
);
CREATE UNIQUE INDEX `role_permissions_role_permission_unique` ON `role_permissions` (`role_id`, `permission`);

CREATE TABLE `invitations` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `email` text NOT NULL,
  `role` text NOT NULL,
  `token_hash` text NOT NULL,
  `invited_by` text NOT NULL,
  `expires_at` integer NOT NULL,
  `accepted_at` integer,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`),
  FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`)
);
CREATE UNIQUE INDEX `invitations_token_hash_unique` ON `invitations` (`token_hash`);

CREATE TABLE `audit_events` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text,
  `actor_user_id` text,
  `action` text NOT NULL,
  `target_type` text NOT NULL,
  `target_id` text,
  `metadata_json` text DEFAULT '{}' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`),
  FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE `staff_pin_credentials` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `user_id` text NOT NULL,
  `pin_hash` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `disabled_at` integer,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
CREATE UNIQUE INDEX `staff_pin_workspace_user_unique` ON `staff_pin_credentials` (`workspace_id`, `user_id`);

CREATE TABLE `plugin_permission_scopes` (`scope` text PRIMARY KEY NOT NULL, `description` text NOT NULL);

CREATE TABLE `platform_memberships` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `role` text DEFAULT 'platform_owner' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
CREATE UNIQUE INDEX `platform_memberships_user_unique` ON `platform_memberships` (`user_id`);

CREATE TABLE `pages` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `slug` text NOT NULL,
  `title` text NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `sections_json` text DEFAULT '[]' NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`)
);

CREATE TABLE `content_items` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `kind` text NOT NULL,
  `title` text NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `price` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`)
);

CREATE TABLE `submissions` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `type` text NOT NULL,
  `item_id` text,
  `item_title` text DEFAULT 'General enquiry' NOT NULL,
  `customer_name` text NOT NULL,
  `email` text NOT NULL,
  `phone` text DEFAULT '' NOT NULL,
  `message` text DEFAULT '' NOT NULL,
  `status` text DEFAULT 'new' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`)
);

CREATE TABLE `custom_domains` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `hostname` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`)
);

CREATE UNIQUE INDEX `custom_domains_hostname_unique`
  ON `custom_domains` (`hostname`);

INSERT INTO `roles` (`id`, `name`, `scope`) VALUES
 ('owner','Workspace owner','workspace'), ('administrator','Administrator','workspace'),
 ('website_editor','Website editor','workspace'), ('store_manager','Store manager','workspace'),
 ('pos_manager','POS manager','workspace'), ('pos_staff','POS staff','workspace'),
 ('support_viewer','Support / view only','workspace'), ('platform_owner','Platform owner','platform');

INSERT INTO `role_permissions` (`role_id`, `permission`) VALUES
 ('owner','workspace.read'), ('owner','workspace.update'), ('owner','members.read'), ('owner','members.invite'), ('owner','members.manage'), ('owner','content.read'), ('owner','content.write'), ('owner','content.delete'), ('owner','pages.read'), ('owner','pages.write'), ('owner','pages.publish'), ('owner','submissions.read'), ('owner','submissions.write'), ('owner','settings.write'), ('owner','capabilities.write'), ('owner','audit.read'), ('owner','pos.sell'), ('owner','pos.manage'),
 ('administrator','workspace.read'), ('administrator','workspace.update'), ('administrator','members.read'), ('administrator','members.invite'), ('administrator','members.manage'), ('administrator','content.read'), ('administrator','content.write'), ('administrator','content.delete'), ('administrator','pages.read'), ('administrator','pages.write'), ('administrator','pages.publish'), ('administrator','submissions.read'), ('administrator','submissions.write'), ('administrator','settings.write'), ('administrator','capabilities.write'), ('administrator','audit.read'), ('administrator','pos.manage'),
 ('website_editor','workspace.read'), ('website_editor','content.read'), ('website_editor','content.write'), ('website_editor','pages.read'), ('website_editor','pages.write'), ('website_editor','pages.publish'),
 ('store_manager','workspace.read'), ('store_manager','content.read'), ('store_manager','content.write'), ('store_manager','content.delete'), ('store_manager','submissions.read'), ('store_manager','submissions.write'),
 ('pos_manager','workspace.read'), ('pos_manager','content.read'), ('pos_manager','submissions.read'), ('pos_manager','pos.sell'), ('pos_manager','pos.manage'),
 ('pos_staff','workspace.read'), ('pos_staff','content.read'), ('pos_staff','pos.sell'),
 ('support_viewer','workspace.read'), ('support_viewer','members.read'), ('support_viewer','content.read'), ('support_viewer','pages.read'), ('support_viewer','submissions.read'), ('support_viewer','audit.read'),
 ('platform_owner','platform.manage'), ('platform_owner','platform.audit.read'), ('platform_owner','platform.support.access');

INSERT INTO `plugin_permission_scopes` (`scope`, `description`) VALUES
 ('catalog:read','Read published catalog data through CatalogService'),
 ('catalog:write','Create or update catalog data through CatalogService'),
 ('orders:read','Read orders through OrderService'),
 ('orders:write','Create or update orders through OrderService'),
 ('customers:read','Read customer profiles through CustomerService'),
 ('customers:write','Create or update customer profiles through CustomerService'),
 ('website:read','Read site and page documents through Website services'),
 ('website:write','Create or update draft website content through Website services');
