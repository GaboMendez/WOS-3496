import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// A replaceable, source-owned read model. These records never represent staff edits
// or imply that an anonymous observation identifies a portal player.
export const stateObservations = sqliteTable("state_observations", {
  id: text("id").primaryKey(),
  revision: text("revision").notNull(),
  stateNumber: integer("state_number").notNull(),
  fetchedAt: text("fetched_at").notNull(),
  sourceUpdatedAt: text("source_updated_at").notNull(),
  leaderboardDateLabel: text("leaderboard_date_label"),
  coveredPlayers: integer("covered_players").notNull(),
  rosterTotal: integer("roster_total"),
  rosterPages: integer("roster_pages"),
  rosterComplete: integer("roster_complete", { mode: "boolean" }),
  furnaceComplete: integer("furnace_complete", { mode: "boolean" }),
  sourceLinks: text("source_links", { mode: "json" }).$type<{label: string; url: string}[]>().notNull(),
});

export const stateObservationSections = sqliteTable("state_observation_sections", {
  id: text("id").primaryKey(),
  observationId: text("observation_id").notNull().references(() => stateObservations.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  sectionKey: text("section_key").notNull(),
  title: text("title").notNull(),
}, (t) => [uniqueIndex("state_observation_sections_order").on(t.observationId, t.position)]);

export const stateObservationFacts = sqliteTable("state_observation_facts", {
  sectionId: text("section_id").notNull().references(() => stateObservationSections.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  value: text("value").notNull(),
}, (t) => [uniqueIndex("state_observation_facts_order").on(t.sectionId, t.position)]);

export const stateObservationTables = sqliteTable("state_observation_tables", {
  id: text("id").primaryKey(),
  sectionId: text("section_id").notNull().references(() => stateObservationSections.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  columns: text("columns", { mode: "json" }).$type<string[]>().notNull(),
}, (t) => [uniqueIndex("state_observation_tables_order").on(t.sectionId, t.position)]);

export const stateObservationRows = sqliteTable("state_observation_rows", {
  tableId: text("table_id").notNull().references(() => stateObservationTables.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  cells: text("cells", { mode: "json" }).$type<string[]>().notNull(),
}, (t) => [uniqueIndex("state_observation_rows_order").on(t.tableId, t.position)]);

export const stateFurnaceBands = sqliteTable("state_furnace_bands", {
  id: text("id").primaryKey(),
  observationId: text("observation_id").notNull().references(() => stateObservations.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  band: text("band").notNull(),
  players: integer("players").notNull(),
  label: text("label").notNull(),
  percentage: text("percentage").notNull(),
}, (t) => [uniqueIndex("state_furnace_bands_order").on(t.observationId, t.position)]);

export const stateFurnaceLevels = sqliteTable("state_furnace_levels", {
  bandId: text("band_id").notNull().references(() => stateFurnaceBands.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  level: integer("level").notNull(),
  players: integer("players").notNull(),
}, (t) => [uniqueIndex("state_furnace_levels_order").on(t.bandId, t.position)]);

export const stateFurnacePlayers = sqliteTable("state_furnace_players", {
  observationId: text("observation_id").notNull().references(() => stateObservations.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  chiefId: text("chief_id"),
  name: text("name"),
  allianceTag: text("alliance_tag"),
  level: integer("level").notNull(),
  power: integer("power").notNull(),
  band: text("band").notNull(),
}, (t) => [uniqueIndex("state_furnace_players_order").on(t.observationId, t.position), index("state_furnace_players_chief").on(t.chiefId)]);

// Missing identifiers must not be turned into persistent player identities.
export const stateUnmatchedPlayers = sqliteTable("state_unmatched_players", {
  observationId: text("observation_id").notNull().references(() => stateObservations.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  rank: integer("rank").notNull(),
  name: text("name").notNull(),
  allianceTag: text("alliance_tag"),
  furnaceLevel: text("furnace_level").notNull(),
  power: integer("power").notNull(),
  exactPower: integer("exact_power"),
  numericFurnaceLevel: integer("numeric_furnace_level"),
  furnaceBand: text("furnace_band"),
}, (t) => [uniqueIndex("state_unmatched_players_order").on(t.observationId, t.position)]);

export const stateUpcomingEvents = sqliteTable("state_upcoming_events", {
  observationId: text("observation_id").notNull().references(() => stateObservations.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  dateLabel: text("date_label").notNull(),
  title: text("title").notNull(),
  relativeLabel: text("relative_label").notNull(),
}, (t) => [uniqueIndex("state_upcoming_events_order").on(t.observationId, t.position)]);
