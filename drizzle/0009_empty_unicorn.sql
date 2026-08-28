CREATE TABLE `workspace_service_entitlements` (
	`workspace_id` text NOT NULL,
	`service` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`activated_at` integer NOT NULL,
	`trial_ends_at` integer,
	`suspended_at` integer,
	`cancelled_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_service_entitlements_workspace_service_unique` ON `workspace_service_entitlements` (`workspace_id`,`service`);
--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_service_entitlements`
  (`workspace_id`, `service`, `status`, `activated_at`, `trial_ends_at`, `suspended_at`, `cancelled_at`, `updated_at`)
SELECT w.id, 'ecommerce_website', 'active', w.created_at, NULL, NULL, NULL, w.updated_at
FROM workspaces w
WHERE w.workspace_type = 'commerce_business'
  AND EXISTS (SELECT 1 FROM workspace_capabilities c WHERE c.workspace_id = w.id AND c.capability = 'website');
--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_service_entitlements`
  (`workspace_id`, `service`, `status`, `activated_at`, `trial_ends_at`, `suspended_at`, `cancelled_at`, `updated_at`)
SELECT w.id, 'pos', 'active', w.created_at, NULL, NULL, NULL, w.updated_at
FROM workspaces w
WHERE w.workspace_type = 'commerce_business'
  AND EXISTS (SELECT 1 FROM workspace_capabilities c WHERE c.workspace_id = w.id AND c.capability = 'pos');
--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_service_entitlements`
  (`workspace_id`, `service`, `status`, `activated_at`, `trial_ends_at`, `suspended_at`, `cancelled_at`, `updated_at`)
SELECT w.id,
  CASE w.workspace_type WHEN 'cv' THEN 'cv' WHEN 'portfolio' THEN 'portfolio' ELSE 'business_showcase' END,
  'active', w.created_at, NULL, NULL, NULL, w.updated_at
FROM workspaces w
WHERE w.workspace_type IN ('business_showcase', 'cv', 'portfolio');
--> statement-breakpoint
INSERT OR IGNORE INTO `role_permissions` (`role_id`, `permission`) VALUES
  ('owner', 'services.manage'),
  ('administrator', 'services.manage');
