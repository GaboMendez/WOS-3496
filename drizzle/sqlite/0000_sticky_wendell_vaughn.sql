CREATE TABLE `alliance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`alliance_id` text NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`days` text,
	`utc_time` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `alliance_leaders` (
	`id` text PRIMARY KEY NOT NULL,
	`alliance_id` text NOT NULL,
	`name` text NOT NULL,
	`rank_title` text NOT NULL,
	`discord_handle` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `alliances` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`tag` text NOT NULL,
	`description` text,
	`short_description` text,
	`banner_url` text,
	`power` integer DEFAULT 0 NOT NULL,
	`open_spots` integer DEFAULT 0 NOT NULL,
	`recruiting_status` text DEFAULT 'closed' NOT NULL,
	`playstyle` text,
	`timezone_label` text,
	`hq_coordinates` text,
	`discord_url` text,
	`svs_contribution` text,
	`published` integer DEFAULT false NOT NULL,
	`sort_rank` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`pinned` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `creators` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`handle` text,
	`platform` text,
	`content_type` text,
	`bio` text,
	`avatar_url` text,
	`url` text,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `governance_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`version` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`summary` text,
	`effective_date` text,
	`revised_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `governance_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`title` text NOT NULL,
	`anchor` text NOT NULL,
	`body` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`storage_path` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operations_content` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`section_key` text NOT NULL,
	`body` text,
	`published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`display_name` text,
	`password_hash` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `state_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`state_number` integer NOT NULL,
	`display_name` text NOT NULL,
	`tagline` text,
	`discord_url` text,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`disclaimer` text DEFAULT '' NOT NULL,
	`launch_date` text,
	`hero_generation` text,
	`hero_image_url` text,
	`current_event` text,
	`next_event_date` text,
	`recruiting_status` text,
	`transfer_group` text,
	`transfer_spots` integer,
	`eligibility_range` text,
	`power_cap_note` text,
	`social_links` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `state_stories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`summary` text,
	`body` text,
	`image_url` text,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `svs_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`opponent` text NOT NULL,
	`event_date` text,
	`prep_score` integer,
	`prep_result` text,
	`prep_result_note` text,
	`battle_score` integer,
	`opponent_battle_score` integer,
	`battle_result` text,
	`opponent_prep_score` integer,
	`story_title` text,
	`story_intro` text,
	`story_body` text,
	`image_url` text,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `svs_story_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`cycle_id` text NOT NULL,
	`label` text NOT NULL,
	`metric_kind` text NOT NULL,
	`our_value` real,
	`opponent_value` real,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`event_date` text,
	`server_day` integer,
	`image_url` text,
	`source_url` text,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transfer_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`window_label` text,
	`notes` text,
	`states` text,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transfer_guides` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`action_kind` text NOT NULL,
	`body` text,
	`risk_note` text,
	`published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transfer_windows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`transfer_type` text NOT NULL,
	`status` text DEFAULT 'closed' NOT NULL,
	`phase` text,
	`starts_at` text,
	`ends_at` text,
	`open_spots` integer,
	`eligibility_range` text,
	`power_cap_note` text,
	`notes` text,
	`published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL
);
