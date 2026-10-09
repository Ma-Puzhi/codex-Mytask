CREATE TABLE IF NOT EXISTS `task_github_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`role` text DEFAULT 'output' NOT NULL,
	`name` text NOT NULL,
	`resource_type` text DEFAULT 'file' NOT NULL,
	`repo` text DEFAULT '' NOT NULL,
	`branch` text DEFAULT '' NOT NULL,
	`repo_path` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`commit_sha` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "valid_github_resource_role" CHECK("task_github_resources"."role" IN ('primary','reference','output')),
	CONSTRAINT "valid_github_resource_type" CHECK("task_github_resources"."resource_type" IN ('file','directory','commit','pull_request','release','lfs','external'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_task_github_resources_task` ON `task_github_resources` (`task_id`,`role`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `task_github_workspaces` (
	`task_id` text PRIMARY KEY NOT NULL,
	`repo` text NOT NULL,
	`branch` text DEFAULT 'main' NOT NULL,
	`repo_path` text DEFAULT '' NOT NULL,
	`repo_url` text DEFAULT '' NOT NULL,
	`last_commit_sha` text DEFAULT '' NOT NULL,
	`pr_url` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_task_github_repo` ON `task_github_workspaces` (`repo`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_task_github_commit` ON `task_github_workspaces` (`last_commit_sha`);