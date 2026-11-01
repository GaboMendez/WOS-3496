CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`alliance_id` text,
	`cycle_id` text,
	`rotation_slot_id` text,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`published` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cycle_id`) REFERENCES `svs_cycles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rotation_slot_id`) REFERENCES `rotation_slots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `event_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`player_id` text NOT NULL,
	`role` text NOT NULL,
	`attendance` text NOT NULL,
	`score` integer,
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_participants_unique` ON `event_participants` (`event_id`,`player_id`);--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`level` integer NOT NULL,
	`coordinates` text NOT NULL,
	`territory` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`chief_id` text,
	`alliance_id` text NOT NULL,
	`name` text NOT NULL,
	`rank_title` text NOT NULL,
	`furnace_level` text NOT NULL,
	`power` integer NOT NULL,
	`kills` integer DEFAULT 0 NOT NULL,
	`activity_status` text NOT NULL,
	`account_kind` text NOT NULL,
	`farm_of_player_id` text,
	`last_active_at` text,
	FOREIGN KEY (`alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`farm_of_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_chief_id_unique` ON `players` (`chief_id`);--> statement-breakpoint
CREATE INDEX `players_alliance_idx` ON `players` (`alliance_id`);--> statement-breakpoint
CREATE TABLE `ranking_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`player_id` text,
	`alliance_id` text,
	`rank` integer NOT NULL,
	`value` integer NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `ranking_snapshots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ranking_entries_rank_unique` ON `ranking_entries` (`snapshot_id`,`rank`);--> statement-breakpoint
CREATE TABLE `ranking_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`metric` text NOT NULL,
	`subject_kind` text NOT NULL,
	`captured_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rotation_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`facility_id` text,
	`alliance_id` text NOT NULL,
	`player_id` text,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text NOT NULL,
	`responsibility` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rotation_slots_time_idx` ON `rotation_slots` (`starts_at`,`ends_at`);--> statement-breakpoint
CREATE TABLE `seed_records` (
	`id` text PRIMARY KEY NOT NULL,
	`dataset` text NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`origin` text NOT NULL,
	`source_url` text,
	`observed_at` text NOT NULL,
	`note` text NOT NULL,
	`field_sources` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seed_records_record_unique` ON `seed_records` (`table_name`,`record_id`);--> statement-breakpoint
ALTER TABLE `alliance_leaders` ADD `player_id` text REFERENCES players(id);--> statement-breakpoint
ALTER TABLE `alliances` ADD `kind` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `alliances` ADD `farm_of_alliance_id` text REFERENCES alliances(id);