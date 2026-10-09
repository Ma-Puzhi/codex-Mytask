CREATE TABLE `task_ai_sessions` (
	`task_id` text NOT NULL,
	`mode` text NOT NULL,
	`conversation_url` text NOT NULL,
	`conversation_title` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`task_id`, `mode`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "valid_ai_session_mode" CHECK("task_ai_sessions"."mode" IN ('chat','work'))
);
