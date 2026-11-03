"use server";

import { unstable_noStore as noStore } from "next/cache";
import { db } from "../../db";
import {
  alliances,
  allianceLeaders,
  allianceEvents,
  svsCycles,
  svsStoryMetrics,
  creators,
  transferWindows,
  timelineEvents,
  governanceDocuments,
  governanceSections,
  operationsContent,
  stateStories,
  transferGuides,
  transferGroups,
  type Alliance,
  type SvsCycle,
  type Creator,
  type StateSetting,
  type TransferWindow,
  type TimelineEvent,
  type GovernanceDocument,
  type OperationsContent,
  type StateStory,
  type TransferGuide,
  type TransferGroup,
} from "../../db/schema";
import { eq, desc, asc, and, inArray } from "drizzle-orm";

// State Settings
export async function getStateSettings(): Promise<StateSetting | null> {
  noStore();
  const result = await db.query.stateSettings.findFirst();
  return result || null;
}

// Alliances
export async function getAlliances(published = true): Promise<Alliance[]> {
  const query = db.select().from(alliances).orderBy(asc(alliances.sortRank));
  if (published) {
    return query.where(eq(alliances.published, true));
  }
  return query;
}

export async function getAllianceBySlug(slug: string): Promise<Alliance | null> {
  const result = await db.query.alliances.findFirst({
    where: and(eq(alliances.slug, slug), eq(alliances.published, true)),
  });
  return result ?? null;
}

export async function getAllianceLeaders(allianceId: string) {
  return db.select().from(allianceLeaders).where(eq(allianceLeaders.allianceId, allianceId)).orderBy(asc(allianceLeaders.sortOrder));
}

export async function getAllianceEvents(allianceId: string) {
  return db.select().from(allianceEvents).where(eq(allianceEvents.allianceId, allianceId)).orderBy(asc(allianceEvents.sortOrder));
}

// SVS Cycles
export async function getSvsCycles(published = true): Promise<SvsCycle[]> {
  const query = db.select().from(svsCycles).orderBy(desc(svsCycles.eventDate));
  if (published) {
    return query.where(eq(svsCycles.published, true));
  }
  return query;
}

export async function getSvsCycleBySlug(slug: string): Promise<SvsCycle | null> {
  const result = await db.query.svsCycles.findFirst({
    where: and(eq(svsCycles.slug, slug), eq(svsCycles.published, true)),
  });
  return result ?? null;
}

export async function getSvsStoryMetrics(cycleId: string) {
  return db.select().from(svsStoryMetrics).where(eq(svsStoryMetrics.cycleId, cycleId)).orderBy(asc(svsStoryMetrics.sortOrder));
}

// Creators
export async function getCreators(published = true): Promise<Creator[]> {
  const query = db.select().from(creators).orderBy(asc(creators.sortOrder));
  if (published) {
    return query.where(eq(creators.published, true));
  }
  return query;
}

export async function getFeaturedCreators(): Promise<Creator[]> {
  return db
    .select()
    .from(creators)
    .where(and(eq(creators.published, true), eq(creators.featured, true)))
    .orderBy(asc(creators.sortOrder));
}

// Transfer Windows
export async function getTransferWindows(published = true): Promise<TransferWindow[]> {
  const query = db.select().from(transferWindows).orderBy(asc(transferWindows.sortOrder));
  if (published) {
    return query.where(eq(transferWindows.published, true));
  }
  return query;
}

// Transfer Guides
export async function getTransferGuides(published = true): Promise<TransferGuide[]> {
  const query = db.select().from(transferGuides).orderBy(asc(transferGuides.sortOrder));
  if (published) {
    return query.where(eq(transferGuides.published, true));
  }
  return query;
}

export async function getTransferGroups(): Promise<TransferGroup[]> {
  return db.select().from(transferGroups).where(eq(transferGroups.published, true)).orderBy(asc(transferGroups.name));
}

// Timeline Events
export async function getTimelineEvents(published = true): Promise<TimelineEvent[]> {
  const query = db.select().from(timelineEvents).orderBy(desc(timelineEvents.eventDate));
  if (published) {
    return query.where(eq(timelineEvents.published, true));
  }
  return query;
}

// Governance Documents
export async function getGovernanceDocuments(): Promise<GovernanceDocument[]> {
  return db.select().from(governanceDocuments).where(inArray(governanceDocuments.status, ["published", "active"])).orderBy(desc(governanceDocuments.effectiveDate));
}

export async function getGovernanceSections(documentId: string) {
  return db.select().from(governanceSections).where(eq(governanceSections.documentId, documentId)).orderBy(asc(governanceSections.sortOrder));
}

// Operations Content
export async function getOperationsContent(published = true): Promise<OperationsContent[]> {
  const query = db.select().from(operationsContent).orderBy(asc(operationsContent.sortOrder));
  if (published) {
    return query.where(eq(operationsContent.published, true));
  }
  return query;
}

// State Stories
export async function getStateStories(published = true): Promise<StateStory[]> {
  const query = db.select().from(stateStories).orderBy(desc(stateStories.publishedAt));
  if (published) {
    return query.where(eq(stateStories.published, true));
  }
  return query;
}
