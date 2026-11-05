ALTER TABLE `alliances` ADD `source_alliance_tag` text;--> statement-breakpoint
CREATE UNIQUE INDEX `alliances_source_alliance_tag_unique` ON `alliances` (`source_alliance_tag`);