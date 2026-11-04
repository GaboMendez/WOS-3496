CREATE TABLE `source_sync` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text,
	`status` text DEFAULT 'idle' NOT NULL,
	`last_attempt_at` integer,
	`last_success_at` integer,
	`next_allowed_at` integer DEFAULT 0 NOT NULL,
	`lease_token` text,
	`lease_expires_at` integer DEFAULT 0 NOT NULL,
	`last_error` text
);
