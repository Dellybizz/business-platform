ALTER TABLE `users` ADD `auth_provider` text;--> statement-breakpoint
ALTER TABLE `users` ADD `auth_subject` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth_identity_unique` ON `users` (`auth_provider`,`auth_subject`);
