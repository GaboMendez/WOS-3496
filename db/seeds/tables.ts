import * as schema from "../schema";

// Parents before children; authentication tables are never seeded or reset.
export const seedTables = {
  stateSettings: schema.stateSettings,
  alliances: schema.alliances,
  players: schema.players,
  allianceLeaders: schema.allianceLeaders,
  allianceEvents: schema.allianceEvents,
  announcements: schema.announcements,
  creators: schema.creators,
  governanceDocuments: schema.governanceDocuments,
  governanceSections: schema.governanceSections,
  mediaAssets: schema.mediaAssets,
  operationsContent: schema.operationsContent,
  stateStories: schema.stateStories,
  svsCycles: schema.svsCycles,
  svsStoryMetrics: schema.svsStoryMetrics,
  timelineEvents: schema.timelineEvents,
  transferGroups: schema.transferGroups,
  transferGuides: schema.transferGuides,
  transferWindows: schema.transferWindows,
  facilities: schema.facilities,
  rotationSlots: schema.rotationSlots,
  calendarEvents: schema.calendarEvents,
  eventParticipants: schema.eventParticipants,
  rankingSnapshots: schema.rankingSnapshots,
  rankingEntries: schema.rankingEntries,
} as const;

export type SeedTable = keyof typeof seedTables;
export type SeedData = { [K in SeedTable]: (typeof seedTables)[K]["$inferInsert"][] };
export const tableKeys = Object.keys(seedTables) as SeedTable[];
export const AS_OF = "2026-10-29T00:00:00.000Z";
