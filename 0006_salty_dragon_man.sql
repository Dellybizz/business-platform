CREATE TABLE `workspace_capabilities` (
	`workspace_id` text NOT NULL,
	`capability` text NOT NULL,
	`enabled_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_capabilities_workspace_capability_unique` ON `workspace_capabilities` (`workspace_id`,`capability`);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `workspace_type` text DEFAULT 'business_showcase' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `business_category` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `onboarding_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_onboarding_key_unique` ON `workspaces` (`onboarding_key`);--> statement-breakpoint
UPDATE `workspaces`
SET `workspace_type` = CASE
	WHEN `mode` = 'store' THEN 'commerce_business'
	WHEN `mode` = 'services' THEN 'business_showcase'
	ELSE 'portfolio'
END;--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_capabilities` (`workspace_id`, `capability`, `enabled_at`)
SELECT `id`, 'website', `updated_at` FROM `workspaces`;--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_capabilities` (`workspace_id`, `capability`, `enabled_at`)
SELECT `id`, 'catalog', `updated_at` FROM `workspaces` WHERE `workspace_type` = 'commerce_business';--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_capabilities` (`workspace_id`, `capability`, `enabled_at`)
SELECT `id`, 'checkout', `updated_at` FROM `workspaces` WHERE `workspace_type` = 'commerce_business';--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_capabilities` (`workspace_id`, `capability`, `enabled_at`)
SELECT `id`, 'pos', `updated_at` FROM `workspaces` WHERE `workspace_type` = 'commerce_business';--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_capabilities` (`workspace_id`, `capability`, `enabled_at`)
SELECT `id`, 'services', `updated_at` FROM `workspaces` WHERE `workspace_type` = 'business_showcase';--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_capabilities` (`workspace_id`, `capability`, `enabled_at`)
SELECT `id`, 'bookings', `updated_at` FROM `workspaces` WHERE `workspace_type` = 'business_showcase';--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_capabilities` (`workspace_id`, `capability`, `enabled_at`)
SELECT `id`, 'blog', `updated_at` FROM `workspaces` WHERE `workspace_type` IN ('business_showcase', 'portfolio');--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_capabilities` (`workspace_id`, `capability`, `enabled_at`)
SELECT `id`, 'portfolio', `updated_at` FROM `workspaces` WHERE `workspace_type` IN ('cv', 'portfolio');
