CREATE TABLE `app_settings` (
	`owner_id` text NOT NULL,
	`setting_key` text NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner_id`, `setting_key`)
);
--> statement-breakpoint
CREATE TABLE `daily_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`report_date` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reports_owner_date` ON `daily_reports` (`owner_id`,`report_date`);--> statement-breakpoint
CREATE TABLE `task_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`task_id` text,
	`event_type` text NOT NULL,
	`detail_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_owner_created` ON `task_events` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_events_task_created` ON `task_events` (`task_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`goal` text DEFAULT '' NOT NULL,
	`project` text DEFAULT '' NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`next_actions_json` text DEFAULT '[]' NOT NULL,
	`priority` text DEFAULT 'P2' NOT NULL,
	`bucket` text DEFAULT 'today' NOT NULL,
	`due_date` text,
	`estimate_min` integer,
	`status` text DEFAULT 'todo' NOT NULL,
	`review_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	CONSTRAINT "valid_priority" CHECK("tasks"."priority" IN ('P1','P2','P3','P4')),
	CONSTRAINT "valid_bucket" CHECK("tasks"."bucket" IN ('today','upcoming','backlog')),
	CONSTRAINT "valid_status" CHECK("tasks"."status" IN ('todo','in_progress','done','deferred','dropped','blocked'))
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_owner_due` ON `tasks` (`owner_id`,`due_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_owner_status` ON `tasks` (`owner_id`,`status`);