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
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);

CREATE TABLE `memberships` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `workspace_id` text NOT NULL,
  `role` text DEFAULT 'owner' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`)
);

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
