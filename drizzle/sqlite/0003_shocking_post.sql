CREATE TEMP TABLE `__wos_3496_integrity` (`valid` integer CHECK (`valid` = 1));
--> statement-breakpoint
INSERT INTO `__wos_3496_integrity` SELECT 0 WHERE EXISTS (SELECT 1 FROM alliance_leaders WHERE alliance_id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'alliances') AND id NOT IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'allianceLeaders'));
--> statement-breakpoint
INSERT INTO `__wos_3496_integrity` SELECT 0 WHERE EXISTS (SELECT 1 FROM alliance_events WHERE alliance_id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'alliances') AND id NOT IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'allianceEvents'));
--> statement-breakpoint
INSERT INTO `__wos_3496_integrity` SELECT 0 WHERE EXISTS (SELECT 1 FROM governance_sections WHERE document_id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'governanceDocuments') AND id NOT IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'governanceSections'));
--> statement-breakpoint
INSERT INTO `__wos_3496_integrity` SELECT 0 WHERE EXISTS (SELECT 1 FROM svs_story_metrics WHERE cycle_id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'svsCycles') AND id NOT IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'svsStoryMetrics'));
--> statement-breakpoint
DELETE FROM `ranking_entries` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'rankingEntries');
--> statement-breakpoint
DELETE FROM `ranking_snapshots` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'rankingSnapshots');
--> statement-breakpoint
DELETE FROM `event_participants` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'eventParticipants');
--> statement-breakpoint
DELETE FROM `calendar_events` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'calendarEvents');
--> statement-breakpoint
DELETE FROM `rotation_slots` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'rotationSlots');
--> statement-breakpoint
DELETE FROM `facilities` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'facilities');
--> statement-breakpoint
DELETE FROM `transfer_windows` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'transferWindows');
--> statement-breakpoint
DELETE FROM `transfer_guides` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'transferGuides');
--> statement-breakpoint
DELETE FROM `transfer_groups` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'transferGroups');
--> statement-breakpoint
DELETE FROM `timeline_events` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'timelineEvents');
--> statement-breakpoint
DELETE FROM `svs_story_metrics` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'svsStoryMetrics');
--> statement-breakpoint
DELETE FROM `svs_cycles` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'svsCycles');
--> statement-breakpoint
DELETE FROM `state_stories` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'stateStories');
--> statement-breakpoint
DELETE FROM `operations_content` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'operationsContent');
--> statement-breakpoint
DELETE FROM `media_assets` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'mediaAssets');
--> statement-breakpoint
DELETE FROM `governance_sections` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'governanceSections');
--> statement-breakpoint
DELETE FROM `governance_documents` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'governanceDocuments');
--> statement-breakpoint
DELETE FROM `creators` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'creators');
--> statement-breakpoint
DELETE FROM `announcements` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'announcements');
--> statement-breakpoint
DELETE FROM `alliance_events` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'allianceEvents');
--> statement-breakpoint
DELETE FROM `alliance_leaders` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'allianceLeaders');
--> statement-breakpoint
DELETE FROM `players` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'players');
--> statement-breakpoint
DELETE FROM `alliances` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'alliances');
--> statement-breakpoint
DELETE FROM `state_settings` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'stateSettings');
--> statement-breakpoint
DELETE FROM `state_snapshots` WHERE id IN (SELECT record_id FROM seed_records WHERE dataset = 'wos3496-demo-v1' AND table_name = 'stateSnapshots');
--> statement-breakpoint
DROP TABLE `seed_records`;--> statement-breakpoint
DROP TABLE `state_snapshots`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_alliances` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`tag` text NOT NULL,
	`kind` text DEFAULT 'active' NOT NULL,
	`farm_of_alliance_id` text,
	`description` text,
	`short_description` text,
	`banner_url` text,
	`power` integer DEFAULT 0,
	`open_spots` integer DEFAULT 0,
	`recruiting_status` text DEFAULT 'closed',
	`playstyle` text,
	`timezone_label` text,
	`hq_coordinates` text,
	`discord_url` text,
	`svs_contribution` text,
	`published` integer DEFAULT false NOT NULL,
	`sort_rank` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`farm_of_alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_alliances`("id", "name", "slug", "tag", "kind", "farm_of_alliance_id", "description", "short_description", "banner_url", "power", "open_spots", "recruiting_status", "playstyle", "timezone_label", "hq_coordinates", "discord_url", "svs_contribution", "published", "sort_rank", "created_at", "updated_at") SELECT "id", "name", "slug", "tag", "kind", "farm_of_alliance_id", "description", "short_description", "banner_url", "power", "open_spots", "recruiting_status", "playstyle", "timezone_label", "hq_coordinates", "discord_url", "svs_contribution", "published", "sort_rank", "created_at", "updated_at" FROM `alliances`;--> statement-breakpoint
DROP TABLE `alliances`;--> statement-breakpoint
ALTER TABLE `__new_alliances` RENAME TO `alliances`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_facilities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`level` integer,
	`coordinates` text,
	`territory` text,
	`notes` text
);
--> statement-breakpoint
INSERT INTO `__new_facilities`("id", "name", "kind", "level", "coordinates", "territory", "notes") SELECT "id", "name", "kind", "level", "coordinates", "territory", "notes" FROM `facilities`;--> statement-breakpoint
DROP TABLE `facilities`;--> statement-breakpoint
ALTER TABLE `__new_facilities` RENAME TO `facilities`;--> statement-breakpoint
CREATE TABLE `__new_players` (
	`id` text PRIMARY KEY NOT NULL,
	`chief_id` text,
	`alliance_id` text NOT NULL,
	`name` text NOT NULL,
	`rank_title` text,
	`furnace_level` text,
	`power` integer,
	`kills` integer,
	`activity_status` text,
	`account_kind` text,
	`farm_of_player_id` text,
	`last_active_at` text,
	FOREIGN KEY (`alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`farm_of_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_players`("id", "chief_id", "alliance_id", "name", "rank_title", "furnace_level", "power", "kills", "activity_status", "account_kind", "farm_of_player_id", "last_active_at") SELECT "id", "chief_id", "alliance_id", "name", "rank_title", "furnace_level", "power", "kills", "activity_status", "account_kind", "farm_of_player_id", "last_active_at" FROM `players`;--> statement-breakpoint
DROP TABLE `players`;--> statement-breakpoint
ALTER TABLE `__new_players` RENAME TO `players`;--> statement-breakpoint
CREATE UNIQUE INDEX `players_chief_id_unique` ON `players` (`chief_id`);--> statement-breakpoint
CREATE INDEX `players_alliance_idx` ON `players` (`alliance_id`);--> statement-breakpoint
CREATE TABLE `__new_rotation_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`facility_id` text,
	`alliance_id` text NOT NULL,
	`player_id` text,
	`player_name` text,
	`all_day` integer DEFAULT false NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text,
	`status` text NOT NULL,
	`responsibility` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`alliance_id`) REFERENCES `alliances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_rotation_slots`("id", "kind", "facility_id", "alliance_id", "player_id", "player_name", "all_day", "starts_at", "ends_at", "status", "responsibility", "notes") SELECT "id", "kind", "facility_id", "alliance_id", "player_id", NULL, false, "starts_at", "ends_at", "status", "responsibility", "notes" FROM `rotation_slots`;--> statement-breakpoint
DROP TABLE `rotation_slots`;--> statement-breakpoint
ALTER TABLE `__new_rotation_slots` RENAME TO `rotation_slots`;--> statement-breakpoint
CREATE INDEX `rotation_slots_time_idx` ON `rotation_slots` (`starts_at`,`ends_at`);--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `all_day` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `launch_month` text;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `active_alliance_count` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `farm_alliance_count` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `fire_crystal_level` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `svs_rating` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `prep_rating` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `castle_rating` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `global_rank` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `ranked_states` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `transfer_group_rank` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `transfer_group_states` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `top100_power` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `top100_kills` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `top100_exploration` integer;--> statement-breakpoint
ALTER TABLE `state_settings` ADD `statistics_date` text;
--> statement-breakpoint
INSERT INTO `__wos_3496_integrity` SELECT 0 WHERE EXISTS (SELECT 1 FROM pragma_foreign_key_check);
--> statement-breakpoint
DROP TABLE `__wos_3496_integrity`;
