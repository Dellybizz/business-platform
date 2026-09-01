CREATE TABLE `page_document_backups` (`id` text PRIMARY KEY NOT NULL,`page_id` text NOT NULL,`document_json` text NOT NULL,`schema_version` integer NOT NULL,`reason` text NOT NULL,`created_by` text NOT NULL,`created_at` integer NOT NULL,FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`));
--> statement-breakpoint
CREATE INDEX `page_document_backups_page_created` ON `page_document_backups` (`page_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `page_autosaves` (`id` text PRIMARY KEY NOT NULL,`page_id` text NOT NULL,`document_json` text NOT NULL,`schema_version` integer NOT NULL,`created_by` text NOT NULL,`created_at` integer NOT NULL,FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`));
--> statement-breakpoint
CREATE INDEX `page_autosaves_page_created` ON `page_autosaves` (`page_id`,`created_at`);
--> statement-breakpoint
INSERT INTO `page_document_backups` (`id`,`page_id`,`document_json`,`schema_version`,`reason`,`created_by`,`created_at`) SELECT 'phase8-baseline-' || p.id,p.id,v.document_json,v.schema_version,'phase8-baseline',COALESCE(v.created_by,'system'),v.created_at FROM pages p JOIN page_versions v ON v.id=p.draft_version_id;
