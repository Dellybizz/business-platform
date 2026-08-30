CREATE TABLE `sites` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `name` text NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sites_workspace_unique` ON `sites` (`workspace_id`);
--> statement-breakpoint
ALTER TABLE `pages` ADD `site_id` text REFERENCES sites(id);
--> statement-breakpoint
ALTER TABLE `pages` ADD `page_type` text DEFAULT 'standard' NOT NULL;
--> statement-breakpoint
ALTER TABLE `pages` ADD `template_key` text;
--> statement-breakpoint
ALTER TABLE `pages` ADD `draft_version_id` text;
--> statement-breakpoint
ALTER TABLE `pages` ADD `published_version_id` text;
--> statement-breakpoint
ALTER TABLE `pages` ADD `seo_title` text;
--> statement-breakpoint
ALTER TABLE `pages` ADD `seo_description` text;
--> statement-breakpoint
ALTER TABLE `pages` ADD `canonical_url` text;
--> statement-breakpoint
ALTER TABLE `pages` ADD `social_image_asset_id` text;
--> statement-breakpoint
ALTER TABLE `pages` ADD `indexable` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `pages` ADD `created_at` integer;
--> statement-breakpoint
ALTER TABLE `pages` ADD `deleted_at` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_site_slug_unique` ON `pages` (`site_id`,`slug`);
--> statement-breakpoint
CREATE TABLE `page_versions` (
  `id` text PRIMARY KEY NOT NULL,
  `page_id` text NOT NULL,
  `version_number` integer NOT NULL,
  `state` text DEFAULT 'draft' NOT NULL,
  `schema_version` integer DEFAULT 1 NOT NULL,
  `document_json` text NOT NULL,
  `created_by` text,
  `created_at` integer NOT NULL,
  `published_at` integer,
  FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `page_versions_page_number_unique` ON `page_versions` (`page_id`,`version_number`);
--> statement-breakpoint
CREATE UNIQUE INDEX `page_versions_one_draft` ON `page_versions` (`page_id`) WHERE `state` = 'draft';
--> statement-breakpoint
CREATE UNIQUE INDEX `page_versions_one_published` ON `page_versions` (`page_id`) WHERE `state` = 'published';
--> statement-breakpoint
CREATE TABLE `navigation_menus` (`id` text PRIMARY KEY NOT NULL, `site_id` text NOT NULL, `handle` text NOT NULL, `name` text NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`));
--> statement-breakpoint
CREATE UNIQUE INDEX `navigation_menus_site_handle_unique` ON `navigation_menus` (`site_id`,`handle`);
--> statement-breakpoint
CREATE TABLE `navigation_menu_items` (`id` text PRIMARY KEY NOT NULL, `menu_id` text NOT NULL, `parent_id` text, `label` text NOT NULL, `url` text NOT NULL, `position` integer DEFAULT 0 NOT NULL, `created_at` integer NOT NULL, FOREIGN KEY (`menu_id`) REFERENCES `navigation_menus`(`id`), FOREIGN KEY (`parent_id`) REFERENCES `navigation_menu_items`(`id`));
--> statement-breakpoint
CREATE TABLE `site_redirects` (`id` text PRIMARY KEY NOT NULL, `site_id` text NOT NULL, `source_path` text NOT NULL, `destination` text NOT NULL, `status_code` integer DEFAULT 301 NOT NULL, `created_at` integer NOT NULL, FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`));
--> statement-breakpoint
CREATE UNIQUE INDEX `site_redirects_site_source_unique` ON `site_redirects` (`site_id`,`source_path`);
--> statement-breakpoint
CREATE TABLE `site_assets` (`id` text PRIMARY KEY NOT NULL, `site_id` text NOT NULL, `storage_key` text NOT NULL, `mime_type` text NOT NULL, `alt_text` text DEFAULT '' NOT NULL, `created_at` integer NOT NULL, FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`));
--> statement-breakpoint
CREATE TABLE `site_preview_tokens` (`id` text PRIMARY KEY NOT NULL, `site_id` text NOT NULL, `page_id` text, `token_hash` text NOT NULL, `expires_at` integer NOT NULL, `created_by` text NOT NULL, `created_at` integer NOT NULL, `revoked_at` integer, FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`), FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`), FOREIGN KEY (`created_by`) REFERENCES `users`(`id`));
--> statement-breakpoint
CREATE UNIQUE INDEX `site_preview_tokens_token_hash_unique` ON `site_preview_tokens` (`token_hash`);
--> statement-breakpoint
ALTER TABLE `custom_domains` ADD `site_id` text REFERENCES sites(id);
--> statement-breakpoint
ALTER TABLE `custom_domains` ADD `verified_at` integer;
--> statement-breakpoint
INSERT INTO `sites` (`id`,`workspace_id`,`name`,`status`,`created_at`,`updated_at`)
SELECT lower(hex(randomblob(16))), w.`id`, w.`name`, 'active', w.`created_at`, w.`updated_at` FROM `workspaces` w
WHERE EXISTS (SELECT 1 FROM `pages` p WHERE p.`workspace_id`=w.`id`)
   OR EXISTS (SELECT 1 FROM `workspace_capabilities` c WHERE c.`workspace_id`=w.`id` AND c.`capability`='website');
--> statement-breakpoint
UPDATE `pages` SET `site_id` = (SELECT `id` FROM `sites` WHERE `sites`.`workspace_id` = `pages`.`workspace_id`), `page_type` = CASE `slug` WHEN 'home' THEN 'home' WHEN 'shop' THEN 'collection' WHEN 'services' THEN 'service' WHEN 'work' THEN 'portfolio_project' WHEN 'contact' THEN 'contact' ELSE 'standard' END, `created_at` = `updated_at`;
--> statement-breakpoint
INSERT INTO `page_versions` (`id`,`page_id`,`version_number`,`state`,`schema_version`,`document_json`,`created_at`,`published_at`)
SELECT lower(hex(randomblob(16))), `id`, 1, 'draft', 1, json_object('schemaVersion',1,'sections',json(`sections_json`)), `updated_at`, NULL FROM `pages`;
--> statement-breakpoint
UPDATE `pages` SET `draft_version_id` = (SELECT `id` FROM `page_versions` WHERE `page_versions`.`page_id` = `pages`.`id` AND `state`='draft');
--> statement-breakpoint
INSERT INTO `page_versions` (`id`,`page_id`,`version_number`,`state`,`schema_version`,`document_json`,`created_at`,`published_at`)
SELECT lower(hex(randomblob(16))), p.`id`, 2, 'published', 1, d.`document_json`, p.`updated_at`, p.`updated_at` FROM `pages` p JOIN `page_versions` d ON d.`id`=p.`draft_version_id` WHERE p.`status`='published';
--> statement-breakpoint
UPDATE `pages` SET `published_version_id` = (SELECT `id` FROM `page_versions` WHERE `page_versions`.`page_id`=`pages`.`id` AND `state`='published');
--> statement-breakpoint
UPDATE `custom_domains` SET `site_id` = (SELECT `id` FROM `sites` WHERE `sites`.`workspace_id`=`custom_domains`.`workspace_id`), `verified_at` = CASE WHEN `status`='verified' THEN `created_at` ELSE NULL END;
