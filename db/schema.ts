import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Enums
export const appRoleEnum = ["admin", "editor", "viewer"] as const;
export type AppRole = (typeof appRoleEnum)[number];

// Tables

// Alliance leaders
export const allianceLeaders = sqliteTable("alliance_leaders", {
  id: text("id").primaryKey(),
  allianceId: text("alliance_id").notNull(),
  name: text("name").notNull(),
  rankTitle: text("rank_title").notNull(),
  discordHandle: text("discord_handle"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Alliance events
export const allianceEvents = sqliteTable("alliance_events", {
  id: text("id").primaryKey(),
  allianceId: text("alliance_id").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  days: text("days"),
  utcTime: text("utc_time"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Alliances
export const alliances = sqliteTable("alliances", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  tag: text("tag").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  bannerUrl: text("banner_url"),
  power: integer("power").notNull().default(0),
  openSpots: integer("open_spots").notNull().default(0),
  recruitingStatus: text("recruiting_status").notNull().default("closed"),
  playstyle: text("playstyle"),
  timezoneLabel: text("timezone_label"),
  hqCoordinates: text("hq_coordinates"),
  discordUrl: text("discord_url"),
  svsContribution: text("svs_contribution"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  sortRank: integer("sort_rank").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Announcements
export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Creators
export const creators = sqliteTable("creators", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle"),
  platform: text("platform"),
  contentType: text("content_type"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  url: text("url"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Governance documents
export const governanceDocuments = sqliteTable("governance_documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("draft"),
  summary: text("summary"),
  effectiveDate: text("effective_date"),
  revisedDate: text("revised_date"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Governance sections
export const governanceSections = sqliteTable("governance_sections", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  title: text("title").notNull(),
  anchor: text("anchor").notNull(),
  body: text("body"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Media assets
export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  url: text("url").notNull(),
  storagePath: text("storage_path"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Operations content
export const operationsContent = sqliteTable("operations_content", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sectionKey: text("section_key").notNull(),
  body: text("body"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Profiles
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email"),
  displayName: text("display_name"),
  passwordHash: text("password_hash"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// State settings (singleton)
export const stateSettings = sqliteTable("state_settings", {
  id: text("id").primaryKey(),
  stateNumber: integer("state_number").notNull(),
  displayName: text("display_name").notNull(),
  tagline: text("tagline"),
  discordUrl: text("discord_url"),
  timezone: text("timezone").notNull().default("UTC"),
  disclaimer: text("disclaimer").notNull().default(""),
  launchDate: text("launch_date"),
  heroGeneration: text("hero_generation"),
  heroImageUrl: text("hero_image_url"),
  currentEvent: text("current_event"),
  nextEventDate: text("next_event_date"),
  recruitingStatus: text("recruiting_status"),
  transferGroup: text("transfer_group"),
  transferSpots: integer("transfer_spots"),
  eligibilityRange: text("eligibility_range"),
  powerCapNote: text("power_cap_note"),
  socialLinks: text("social_links"), // JSON
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// State stories
export const stateStories = sqliteTable("state_stories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  summary: text("summary"),
  body: text("body"),
  imageUrl: text("image_url"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  publishedAt: text("published_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// SVS cycles
export const svsCycles = sqliteTable("svs_cycles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  opponent: text("opponent").notNull(),
  eventDate: text("event_date"),
  prepScore: integer("prep_score"),
  prepResult: text("prep_result"),
  prepResultNote: text("prep_result_note"),
  battleScore: integer("battle_score"),
  opponentBattleScore: integer("opponent_battle_score"),
  battleResult: text("battle_result"),
  opponentPrepScore: integer("opponent_prep_score"),
  storyTitle: text("story_title"),
  storyIntro: text("story_intro"),
  storyBody: text("story_body"),
  imageUrl: text("image_url"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// SVS story metrics
export const svsStoryMetrics = sqliteTable("svs_story_metrics", {
  id: text("id").primaryKey(),
  cycleId: text("cycle_id").notNull(),
  label: text("label").notNull(),
  metricKind: text("metric_kind").notNull(),
  ourValue: real("our_value"),
  opponentValue: real("opponent_value"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Timeline events
export const timelineEvents = sqliteTable("timeline_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  eventDate: text("event_date"),
  serverDay: integer("server_day"),
  imageUrl: text("image_url"),
  sourceUrl: text("source_url"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Transfer groups
export const transferGroups = sqliteTable("transfer_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  windowLabel: text("window_label"),
  notes: text("notes"),
  states: text("states"), // JSON array
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Transfer guides
export const transferGuides = sqliteTable("transfer_guides", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  actionKind: text("action_kind").notNull(),
  body: text("body"),
  riskNote: text("risk_note"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Transfer windows
export const transferWindows = sqliteTable("transfer_windows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  transferType: text("transfer_type").notNull(),
  status: text("status").notNull().default("closed"),
  phase: text("phase"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  openSpots: integer("open_spots"),
  eligibilityRange: text("eligibility_range"),
  powerCapNote: text("power_cap_note"),
  notes: text("notes"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// User roles
export const userRoles = sqliteTable("user_roles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role", { enum: appRoleEnum }).notNull(),
});

// Export all table types
export type Alliance = typeof alliances.$inferSelect;
export type NewAlliance = typeof alliances.$inferInsert;
export type AllianceLeader = typeof allianceLeaders.$inferSelect;
export type NewAllianceLeader = typeof allianceLeaders.$inferInsert;
export type AllianceEvent = typeof allianceEvents.$inferSelect;
export type NewAllianceEvent = typeof allianceEvents.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type Creator = typeof creators.$inferSelect;
export type NewCreator = typeof creators.$inferInsert;
export type GovernanceDocument = typeof governanceDocuments.$inferSelect;
export type NewGovernanceDocument = typeof governanceDocuments.$inferInsert;
export type GovernanceSection = typeof governanceSections.$inferSelect;
export type NewGovernanceSection = typeof governanceSections.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
export type OperationsContent = typeof operationsContent.$inferSelect;
export type NewOperationsContent = typeof operationsContent.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type StateSetting = typeof stateSettings.$inferSelect;
export type NewStateSetting = typeof stateSettings.$inferInsert;
export type StateStory = typeof stateStories.$inferSelect;
export type NewStateStory = typeof stateStories.$inferInsert;
export type SvsCycle = typeof svsCycles.$inferSelect;
export type NewSvsCycle = typeof svsCycles.$inferInsert;
export type SvsStoryMetric = typeof svsStoryMetrics.$inferSelect;
export type NewSvsStoryMetric = typeof svsStoryMetrics.$inferInsert;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type NewTimelineEvent = typeof timelineEvents.$inferInsert;
export type TransferGroup = typeof transferGroups.$inferSelect;
export type NewTransferGroup = typeof transferGroups.$inferInsert;
export type TransferGuide = typeof transferGuides.$inferSelect;
export type NewTransferGuide = typeof transferGuides.$inferInsert;
export type TransferWindow = typeof transferWindows.$inferSelect;
export type NewTransferWindow = typeof transferWindows.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
