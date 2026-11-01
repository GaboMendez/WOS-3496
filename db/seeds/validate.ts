import { createHash } from "node:crypto";
import { getTableColumns } from "drizzle-orm";
import { seedTables, tableKeys, type SeedData, type SeedTable } from "./tables";

export function fingerprint(data: SeedData): string {
  const stable = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(stable)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, entry]) => [key, stable(entry)]),
          )
        : value;
  return createHash("sha256")
    .update(JSON.stringify(stable(data)))
    .digest("hex");
}

export function validateSeed(data: SeedData) {
  for (const key of tableKeys) {
    const ids = new Set<string>();
    for (const row of data[key]) {
      if (ids.has(row.id)) throw new Error(`Duplicate ${key} ID: ${row.id}`);
      ids.add(row.id);
      const values = row as unknown as Record<string, unknown>;
      for (const [name, column] of Object.entries(getTableColumns(seedTables[key]))) {
        const value = values[name];
        if (column.notNull && value == null) throw new Error(`${key}.${name} is required`);
        if (typeof value === "number" && (!Number.isSafeInteger(value) || value < 0))
          throw new Error(`Invalid ${key}.${name}`);
      }
    }
  }
  const references: [SeedTable, string, SeedTable][] = [
    ["alliances", "farmOfAllianceId", "alliances"],
    ["players", "allianceId", "alliances"],
    ["players", "farmOfPlayerId", "players"],
    ["allianceLeaders", "allianceId", "alliances"],
    ["allianceLeaders", "playerId", "players"],
    ["allianceEvents", "allianceId", "alliances"],
    ["governanceSections", "documentId", "governanceDocuments"],
    ["svsStoryMetrics", "cycleId", "svsCycles"],
    ["rotationSlots", "facilityId", "facilities"],
    ["rotationSlots", "allianceId", "alliances"],
    ["rotationSlots", "playerId", "players"],
    ["calendarEvents", "allianceId", "alliances"],
    ["calendarEvents", "cycleId", "svsCycles"],
    ["calendarEvents", "rotationSlotId", "rotationSlots"],
    ["eventParticipants", "eventId", "calendarEvents"],
    ["eventParticipants", "playerId", "players"],
    ["rankingEntries", "snapshotId", "rankingSnapshots"],
    ["rankingEntries", "playerId", "players"],
    ["rankingEntries", "allianceId", "alliances"],
  ];
  for (const [from, column, to] of references)
    for (const row of data[from]) {
      const value = (row as unknown as Record<string, unknown>)[column];
      if (value != null && !data[to].some((parent) => parent.id === value))
        throw new Error(`Missing ${from}.${column}: ${value}`);
    }
  for (const event of [...data.calendarEvents, ...data.rotationSlots]) {
    if (
      !Number.isFinite(Date.parse(event.startsAt)) ||
      (event.endsAt && Date.parse(event.endsAt) <= Date.parse(event.startsAt))
    )
      throw new Error(`Invalid event interval: ${event.id}`);
  }
  for (const ranking of data.rankingSnapshots) {
    const entries = data.rankingEntries.filter((entry) => entry.snapshotId === ranking.id);
    if (new Set(entries.map((entry) => entry.rank)).size !== entries.length)
      throw new Error("Duplicate ranking position");
    for (const entry of entries)
      if (
        ranking.subjectKind === "player" &&
        ranking.metric === "power" &&
        data.players.find((player) => player.id === entry.playerId)?.power !== entry.value
      )
        throw new Error("Ranking power differs from player power");
  }
}
