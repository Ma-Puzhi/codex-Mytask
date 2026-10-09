CREATE TABLE `task_ai_workspaces` (
	`task_id` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'none' NOT NULL,
	`workspace_url` text DEFAULT '' NOT NULL,
	`workspace_title` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "valid_ai_workspace_mode" CHECK("task_ai_workspaces"."mode" IN ('none','chat','work'))
);
--> statement-breakpoint
CREATE INDEX `idx_task_ai_workspaces_mode` ON `task_ai_workspaces` (`mode`);--> statement-breakpoint
CREATE TABLE `task_chat_links` (
	`task_id` text PRIMARY KEY NOT NULL,
	`chat_url` text DEFAULT '' NOT NULL,
	`conversation_title` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `task_daily_entries` (
	`task_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`plan` text DEFAULT '' NOT NULL,
	`work_log` text DEFAULT '' NOT NULL,
	`blockers` text DEFAULT '' NOT NULL,
	`next_plan` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`task_id`, `entry_date`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_task_daily_entries_date` ON `task_daily_entries` (`task_id`,`entry_date`);--> statement-breakpoint
CREATE TABLE `task_local_git_workspaces` (
	`task_id` text PRIMARY KEY NOT NULL,
	`device_name` text DEFAULT '' NOT NULL,
	`local_path` text DEFAULT '' NOT NULL,
	`repository_name` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`branch` text DEFAULT 'main' NOT NULL,
	`remote_url` text DEFAULT '' NOT NULL,
	`last_commit_sha` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "valid_local_git_visibility" CHECK("task_local_git_workspaces"."visibility" IN ('private','public'))
);
--> statement-breakpoint
CREATE INDEX `idx_task_local_git_repo` ON `task_local_git_workspaces` (`repository_name`);--> statement-breakpoint
CREATE TABLE `task_long_term_settings` (
	`task_id` text PRIMARY KEY NOT NULL,
	`task_type` text DEFAULT 'long_term' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`duration_days` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "valid_long_term_duration" CHECK("task_long_term_settings"."duration_days" >= 1)
);
