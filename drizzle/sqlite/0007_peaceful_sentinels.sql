CREATE TABLE `source_suppressions` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_kind` text NOT NULL,
	`source_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_suppressions_kind_key_unique` ON `source_suppressions` (`entity_kind`,`source_key`);--> statement-breakpoint
CREATE TABLE `state_furnace_bands` (
	`id` text PRIMARY KEY NOT NULL,
	`observation_id` text NOT NULL,
	`position` integer NOT NULL,
	`band` text NOT NULL,
	`players` integer NOT NULL,
	`label` text NOT NULL,
	`percentage` text NOT NULL,
	FOREIGN KEY (`observation_id`) REFERENCES `state_observations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_furnace_bands_order` ON `state_furnace_bands` (`observation_id`,`position`);--> statement-breakpoint
CREATE TABLE `state_furnace_levels` (
	`band_id` text NOT NULL,
	`position` integer NOT NULL,
	`level` integer NOT NULL,
	`players` integer NOT NULL,
	FOREIGN KEY (`band_id`) REFERENCES `state_furnace_bands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_furnace_levels_order` ON `state_furnace_levels` (`band_id`,`position`);--> statement-breakpoint
CREATE TABLE `state_furnace_players` (
	`observation_id` text NOT NULL,
	`position` integer NOT NULL,
	`chief_id` text,
	`name` text,
	`alliance_tag` text,
	`level` integer NOT NULL,
	`power` integer NOT NULL,
	`band` text NOT NULL,
	FOREIGN KEY (`observation_id`) REFERENCES `state_observations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_furnace_players_order` ON `state_furnace_players` (`observation_id`,`position`);--> statement-breakpoint
CREATE INDEX `state_furnace_players_chief` ON `state_furnace_players` (`chief_id`);--> statement-breakpoint
CREATE TABLE `state_observation_facts` (
	`section_id` text NOT NULL,
	`position` integer NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `state_observation_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_observation_facts_order` ON `state_observation_facts` (`section_id`,`position`);--> statement-breakpoint
CREATE TABLE `state_observation_rows` (
	`table_id` text NOT NULL,
	`position` integer NOT NULL,
	`cells` text NOT NULL,
	FOREIGN KEY (`table_id`) REFERENCES `state_observation_tables`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_observation_rows_order` ON `state_observation_rows` (`table_id`,`position`);--> statement-breakpoint
CREATE TABLE `state_observation_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`observation_id` text NOT NULL,
	`position` integer NOT NULL,
	`section_key` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`observation_id`) REFERENCES `state_observations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_observation_sections_order` ON `state_observation_sections` (`observation_id`,`position`);--> statement-breakpoint
CREATE TABLE `state_observation_tables` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`columns` text NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `state_observation_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_observation_tables_order` ON `state_observation_tables` (`section_id`,`position`);--> statement-breakpoint
CREATE TABLE `state_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` text NOT NULL,
	`state_number` integer NOT NULL,
	`fetched_at` text NOT NULL,
	`source_updated_at` text NOT NULL,
	`leaderboard_date_label` text,
	`covered_players` integer NOT NULL,
	`roster_total` integer,
	`roster_pages` integer,
	`roster_complete` integer,
	`furnace_complete` integer,
	`source_links` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `state_unmatched_players` (
	`observation_id` text NOT NULL,
	`position` integer NOT NULL,
	`rank` integer NOT NULL,
	`name` text NOT NULL,
	`alliance_tag` text,
	`furnace_level` text NOT NULL,
	`power` integer NOT NULL,
	`exact_power` integer,
	`numeric_furnace_level` integer,
	`furnace_band` text,
	FOREIGN KEY (`observation_id`) REFERENCES `state_observations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_unmatched_players_order` ON `state_unmatched_players` (`observation_id`,`position`);--> statement-breakpoint
CREATE TABLE `state_upcoming_events` (
	`observation_id` text NOT NULL,
	`position` integer NOT NULL,
	`date_label` text NOT NULL,
	`title` text NOT NULL,
	`relative_label` text NOT NULL,
	FOREIGN KEY (`observation_id`) REFERENCES `state_observations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `state_upcoming_events_order` ON `state_upcoming_events` (`observation_id`,`position`);--> statement-breakpoint
PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_players` (
	`id` text PRIMARY KEY NOT NULL,
	`chief_id` text,
	`alliance_id` text,
	`name` text NOT NULL,
	`rank_title` text,
	`furnace_level` text,
	`power` integer,
	`source_managed` integer DEFAULT false NOT NULL,
	`source_name` text,
	`source_rank` integer,
	`source_alliance_tag` text,
	`source_alliance_id` text,
	`source_furnace_level` text,
	`source_numeric_furnace_level` integer,
	`source_furnace_band` text,
	`source_power` integer,
	`source_exact_power` integer,
	`source_observed_at` text,
	`kills` integer,
	`activity_status` text,
	`account_kind` text,
	`farm_of_player_id` text,
	`last_active_at` text,
	FOREIGN KEY (`alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`farm_of_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_players`("id", "chief_id", "alliance_id", "name", "rank_title", "furnace_level", "power", "kills", "activity_status", "account_kind", "farm_of_player_id", "last_active_at") SELECT "id", "chief_id", "alliance_id", "name", "rank_title", "furnace_level", "power", "kills", "activity_status", "account_kind", "farm_of_player_id", "last_active_at" FROM `players`;--> statement-breakpoint
DROP TABLE `players`;--> statement-breakpoint
ALTER TABLE `__new_players` RENAME TO `players`;--> statement-breakpoint
CREATE UNIQUE INDEX `players_chief_id_unique` ON `players` (`chief_id`);--> statement-breakpoint
CREATE INDEX `players_alliance_idx` ON `players` (`alliance_id`);--> statement-breakpoint
ALTER TABLE `alliances` ADD `source_managed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `alliances` ADD `source_name` text;--> statement-breakpoint
ALTER TABLE `alliances` ADD `source_rank` integer;--> statement-breakpoint
ALTER TABLE `alliances` ADD `source_power` integer;--> statement-breakpoint
ALTER TABLE `alliances` ADD `source_members` integer;--> statement-breakpoint
ALTER TABLE `alliances` ADD `source_median_furnace` text;--> statement-breakpoint
ALTER TABLE `alliances` ADD `source_castle_wins` integer;--> statement-breakpoint
ALTER TABLE `alliances` ADD `source_observed_at` text;--> statement-breakpoint
ALTER TABLE `source_sync` ADD `native_issues` text;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_svs_rating` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_prep_rating` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_castle_rating` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_global_rank` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_ranked_states` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_transfer_group` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_transfer_group_rank` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_transfer_group_states` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_hero_generation` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_fire_crystal_level` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_top100_power` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_top100_kills` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_top100_labyrinth` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_top100_transfer_score` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_top100_troops_power` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_top100_tech_power` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_top100_chief_gear_power` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `source_observed_at` text;--> statement-breakpoint
ALTER TABLE `svs_cycles` ADD `source_managed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `svs_cycles` ADD `source_battle_result` text;--> statement-breakpoint
ALTER TABLE `svs_cycles` ADD `source_side` text;--> statement-breakpoint
ALTER TABLE `svs_cycles` ADD `source_observed_at` text;
