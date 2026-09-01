CREATE TABLE `site_theme_versions` (`id` text PRIMARY KEY NOT NULL,`workspace_id` text NOT NULL,`theme_id` text NOT NULL,`theme_version` integer NOT NULL,`token_overrides_json` text DEFAULT '{}' NOT NULL,`state` text DEFAULT 'active' NOT NULL,`created_by` text,`created_at` integer NOT NULL,`activated_at` integer NOT NULL,FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`));
--> statement-breakpoint
CREATE INDEX `site_theme_versions_workspace_state` ON `site_theme_versions` (`workspace_id`,`state`,`activated_at`);
--> statement-breakpoint
CREATE TABLE `site_theme_previews` (`id` text PRIMARY KEY NOT NULL,`workspace_id` text NOT NULL,`theme_id` text NOT NULL,`theme_version` integer NOT NULL,`token_overrides_json` text DEFAULT '{}' NOT NULL,`token_hash` text NOT NULL,`expires_at` integer NOT NULL,`created_by` text NOT NULL,`created_at` integer NOT NULL,FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`));
--> statement-breakpoint
CREATE UNIQUE INDEX `site_theme_previews_token_hash_unique` ON `site_theme_previews` (`token_hash`);
--> statement-breakpoint
ALTER TABLE `workspaces` ADD `active_theme_version_id` text;
--> statement-breakpoint
INSERT INTO `site_theme_versions` (`id`,`workspace_id`,`theme_id`,`theme_version`,`token_overrides_json`,`state`,`created_at`,`activated_at`) SELECT 'legacy-theme-' || `id`,`id`,`theme_id`,1,'{}','active',`updated_at`,`updated_at` FROM `workspaces`;
--> statement-breakpoint
UPDATE `workspaces` SET `active_theme_version_id`='legacy-theme-' || `id`;
