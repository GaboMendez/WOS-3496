CREATE TABLE `state_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`state_number` integer NOT NULL,
	`source_url` text NOT NULL,
	`captured_at` text NOT NULL,
	`payload` text NOT NULL,
	`note` text NOT NULL,
	`published` integer DEFAULT false NOT NULL
);
