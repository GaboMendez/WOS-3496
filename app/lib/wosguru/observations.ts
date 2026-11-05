import { asc, eq, inArray } from "drizzle-orm";
import type { db as portalDb } from "../../../db";
import {
  stateObservations, stateObservationSections, stateObservationFacts,
  stateObservationTables, stateObservationRows, stateFurnaceBands,
  stateFurnaceLevels, stateFurnacePlayers, stateUnmatchedPlayers, stateUpcomingEvents,
} from "../../../db/observations-schema";
import { SOURCE_ID, snapshotSchema, type SourcePlayer, type WosguruSnapshot } from "./model";

type Transaction = Parameters<Parameters<typeof portalDb.transaction>[0]>[0];
type ObservedData = Pick<WosguruSnapshot, "stateNumber" | "fetchedAt" | "sourceUpdatedAt" |
  "leaderboardDateLabel" | "coveredPlayers" | "coverage" | "sourceLinks" | "sections" |
  "furnace" | "furnacePlayers" | "upcoming"> & { unmatchedPlayers: SourcePlayer[] };

// Limit parameters and requests while keeping every batch in the caller's transaction.
async function batches<T>(items: T[], insert: (batch: T[]) => PromiseLike<unknown>) {
  for (let i = 0; i < items.length; i += 50) await insert(items.slice(i, i + 50));
}

/** Replace only the source-owned observation projection inside the publication transaction. */
export async function applyObservedData(tx: Transaction, input: WosguruSnapshot) {
  const snapshot = snapshotSchema.parse(input);
  const sectionIds = tx.select({ id: stateObservationSections.id }).from(stateObservationSections)
    .where(eq(stateObservationSections.observationId, SOURCE_ID));
  const tableIds = tx.select({ id: stateObservationTables.id }).from(stateObservationTables)
    .where(inArray(stateObservationTables.sectionId, sectionIds));
  const bandIds = tx.select({ id: stateFurnaceBands.id }).from(stateFurnaceBands)
    .where(eq(stateFurnaceBands.observationId, SOURCE_ID));

  // Explicit child-first deletes also work when SQLite foreign keys are disabled.
  await tx.delete(stateObservationRows).where(inArray(stateObservationRows.tableId, tableIds));
  await tx.delete(stateObservationFacts).where(inArray(stateObservationFacts.sectionId, sectionIds));
  await tx.delete(stateObservationTables).where(inArray(stateObservationTables.sectionId, sectionIds));
  await tx.delete(stateObservationSections).where(eq(stateObservationSections.observationId, SOURCE_ID));
  await tx.delete(stateFurnaceLevels).where(inArray(stateFurnaceLevels.bandId, bandIds));
  await tx.delete(stateFurnaceBands).where(eq(stateFurnaceBands.observationId, SOURCE_ID));
  await tx.delete(stateFurnacePlayers).where(eq(stateFurnacePlayers.observationId, SOURCE_ID));
  await tx.delete(stateUnmatchedPlayers).where(eq(stateUnmatchedPlayers.observationId, SOURCE_ID));
  await tx.delete(stateUpcomingEvents).where(eq(stateUpcomingEvents.observationId, SOURCE_ID));
  await tx.delete(stateObservations).where(eq(stateObservations.id, SOURCE_ID));
  await tx.insert(stateObservations).values({
    id: SOURCE_ID, revision: crypto.randomUUID(), stateNumber: snapshot.stateNumber, fetchedAt: snapshot.fetchedAt,
    sourceUpdatedAt: snapshot.sourceUpdatedAt, leaderboardDateLabel: snapshot.leaderboardDateLabel,
    coveredPlayers: snapshot.coveredPlayers, rosterTotal: snapshot.coverage?.rosterTotal ?? null,
    rosterPages: snapshot.coverage?.rosterPages ?? null, rosterComplete: snapshot.coverage?.rosterComplete ?? null,
    furnaceComplete: snapshot.coverage?.furnaceComplete ?? null, sourceLinks: snapshot.sourceLinks,
  });

  const sections: (typeof stateObservationSections.$inferInsert)[] = [];
  const facts: (typeof stateObservationFacts.$inferInsert)[] = [];
  const tables: (typeof stateObservationTables.$inferInsert)[] = [];
  const rows: (typeof stateObservationRows.$inferInsert)[] = [];
  snapshot.sections.forEach((section, position) => {
    const sectionId = `${SOURCE_ID}:section:${position}`;
    sections.push({ id: sectionId, observationId: SOURCE_ID, position, sectionKey: section.id, title: section.title });
    section.facts.forEach((value, factIndex) => facts.push({ sectionId, position: factIndex, value }));
    section.tables.forEach((table, tableIndex) => {
      const tableId = `${sectionId}:table:${tableIndex}`;
      tables.push({ id: tableId, sectionId, position: tableIndex, title: table.title, columns: table.columns });
      table.rows.forEach((cells, rowIndex) => rows.push({ tableId, position: rowIndex, cells }));
    });
  });
  await batches(sections, (batch) => tx.insert(stateObservationSections).values(batch));
  await batches(facts, (batch) => tx.insert(stateObservationFacts).values(batch));
  await batches(tables, (batch) => tx.insert(stateObservationTables).values(batch));
  await batches(rows, (batch) => tx.insert(stateObservationRows).values(batch));

  const bands: (typeof stateFurnaceBands.$inferInsert)[] = [];
  const levels: (typeof stateFurnaceLevels.$inferInsert)[] = [];
  snapshot.furnace.forEach((band, position) => {
    const bandId = `${SOURCE_ID}:band:${position}`;
    bands.push({ id: bandId, observationId: SOURCE_ID, position, band: band.band,
      players: band.players, label: band.label, percentage: band.percentage });
    band.levels.forEach(([level, players], levelIndex) => levels.push({ bandId, position: levelIndex, level, players }));
  });
  await batches(bands, (batch) => tx.insert(stateFurnaceBands).values(batch));
  await batches(levels, (batch) => tx.insert(stateFurnaceLevels).values(batch));
  await batches(snapshot.furnacePlayers.map((player, position) => ({ ...player, position, observationId: SOURCE_ID })),
    (batch) => tx.insert(stateFurnacePlayers).values(batch));
  await batches(snapshot.players.filter((player) => !player.chiefId).map(({ chiefId: _id, ...player }, position) => ({ ...player, position, observationId: SOURCE_ID })),
    (batch) => tx.insert(stateUnmatchedPlayers).values(batch));
  await batches(snapshot.upcoming.map((event, position) => ({ ...event, position, observationId: SOURCE_ID })),
    (batch) => tx.insert(stateUpcomingEvents).values(batch));
}

/** Read a consistent observation without taking a write lock on public requests. */
export async function readObservedData(db: typeof portalDb): Promise<ObservedData | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const header = await db.select().from(stateObservations).where(eq(stateObservations.id, SOURCE_ID)).get();
    if (!header) return null;
    const sectionIds = db.select({ id: stateObservationSections.id }).from(stateObservationSections)
      .where(eq(stateObservationSections.observationId, SOURCE_ID));
    const tableIds = db.select({ id: stateObservationTables.id }).from(stateObservationTables)
      .where(inArray(stateObservationTables.sectionId, sectionIds));
    const bandIds = db.select({ id: stateFurnaceBands.id }).from(stateFurnaceBands)
      .where(eq(stateFurnaceBands.observationId, SOURCE_ID));
    const [sectionRows, facts, tables, rows, bandRows, levels, playerRows, unmatchedRows, eventRows] = await Promise.all([
      db.select().from(stateObservationSections).where(eq(stateObservationSections.observationId, SOURCE_ID)).orderBy(asc(stateObservationSections.position)),
      db.select().from(stateObservationFacts).where(inArray(stateObservationFacts.sectionId, sectionIds)).orderBy(asc(stateObservationFacts.position)),
      db.select().from(stateObservationTables).where(inArray(stateObservationTables.sectionId, sectionIds)).orderBy(asc(stateObservationTables.position)),
      db.select().from(stateObservationRows).where(inArray(stateObservationRows.tableId, tableIds)).orderBy(asc(stateObservationRows.position)),
      db.select().from(stateFurnaceBands).where(eq(stateFurnaceBands.observationId, SOURCE_ID)).orderBy(asc(stateFurnaceBands.position)),
      db.select().from(stateFurnaceLevels).where(inArray(stateFurnaceLevels.bandId, bandIds)).orderBy(asc(stateFurnaceLevels.position)),
      db.select().from(stateFurnacePlayers).where(eq(stateFurnacePlayers.observationId, SOURCE_ID)).orderBy(asc(stateFurnacePlayers.position)),
      db.select().from(stateUnmatchedPlayers).where(eq(stateUnmatchedPlayers.observationId, SOURCE_ID)).orderBy(asc(stateUnmatchedPlayers.position)),
      db.select().from(stateUpcomingEvents).where(eq(stateUpcomingEvents.observationId, SOURCE_ID)).orderBy(asc(stateUpcomingEvents.position)),
    ]);
    const latest = await db.select({ revision: stateObservations.revision }).from(stateObservations)
      .where(eq(stateObservations.id, SOURCE_ID)).get();
    if (latest?.revision !== header.revision) continue;
    return {
      stateNumber: 3496, fetchedAt: header.fetchedAt, sourceUpdatedAt: header.sourceUpdatedAt,
      leaderboardDateLabel: header.leaderboardDateLabel, coveredPlayers: header.coveredPlayers,
      coverage: header.rosterTotal != null && header.rosterPages != null && header.rosterComplete != null && header.furnaceComplete != null
        ? { rosterTotal: header.rosterTotal, rosterPages: header.rosterPages, rosterComplete: header.rosterComplete, furnaceComplete: header.furnaceComplete }
        : null,
      sourceLinks: header.sourceLinks,
      sections: sectionRows.map((section) => ({ id: section.sectionKey, title: section.title,
        facts: facts.filter((fact) => fact.sectionId === section.id).map((fact) => fact.value),
        tables: tables.filter((table) => table.sectionId === section.id).map((table) => ({ title: table.title,
          columns: table.columns, rows: rows.filter((row) => row.tableId === table.id).map((row) => row.cells) })) })),
      furnace: bandRows.map((band) => ({ band: band.band, players: band.players, label: band.label, percentage: band.percentage,
        levels: levels.filter((level) => level.bandId === band.id).map((level): [number, number] => [level.level, level.players]) })),
      furnacePlayers: playerRows.map(({ name, allianceTag, level, power, chiefId, band }) => ({ name, allianceTag, level, power, chiefId, band })),
      unmatchedPlayers: unmatchedRows.map(({ rank, name, allianceTag, furnaceLevel, power, exactPower, numericFurnaceLevel, furnaceBand }) =>
        ({ rank, name, chiefId: null, allianceTag, furnaceLevel, power, exactPower, numericFurnaceLevel, furnaceBand })),
      upcoming: eventRows.map(({ dateLabel, title, relativeLabel }) => ({ dateLabel, title, relativeLabel })),
    };
  }
  throw new Error("State data changed while loading; please retry");
}
