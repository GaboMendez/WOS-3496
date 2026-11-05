import { expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../db/schema.ts";
import { applyObservedData, readObservedData } from "../app/lib/wosguru/observations.ts";

const original = {
  version: 2, stateNumber: 3496, fetchedAt: "2026-11-03T08:00:00.000Z", sourceUpdatedAt: "2026-11-03T07:00:00.000Z",
  leaderboardDateLabel: "3 Nov", coveredPlayers: 2,
  state: { svsRating: 1, prepRating: 1, castleRating: 1, globalRank: 1, rankedStates: 1,
    transferGroup: 1, transferGroupRank: 1, transferGroupStates: 1, heroGeneration: null,
    fireCrystalLevel: null, top100Power: 1, top100Kills: null, top100Labyrinth: null,
    top100TransferScore: null, top100TroopsPower: null, top100TechPower: null, top100ChiefGearPower: null },
  alliances: [{ rank: 1, tag: "A", name: "One", power: 123, members: 2, medianFurnace: "FC1", castleWins: null }],
  players: [
    { rank: 1, chiefId: "123", name: "Named", allianceTag: "A", furnaceLevel: "FC1", power: 100, exactPower: null, numericFurnaceLevel: null, furnaceBand: null },
    { rank: 2, chiefId: null, name: "Unknown ID", allianceTag: null, furnaceLevel: "F30", power: 80, exactPower: null, numericFurnaceLevel: null, furnaceBand: null },
  ],
  furnace: [{ band: "fc1", players: 2, label: "FC1", percentage: "12.5%", levels: [[31, 1], [32, 1]] }],
  furnacePlayers: [
    { chiefId: null, name: null, allianceTag: null, level: 31, power: 99, band: "fc1" },
    { chiefId: null, name: null, allianceTag: null, level: 31, power: 99, band: "fc1" },
    { chiefId: "123", name: "Named", allianceTag: "A", level: 32, power: 100, band: "fc1" },
  ],
  svs: [{ date: "2026-11-01", opponent: 3400, side: "attack", result: "win" }],
  upcoming: [{ dateLabel: "7 Nov", title: "Battle", relativeLabel: "in 4 days" }],
  sections: [{ id: "moves", title: "Moves", facts: ["fact one", "fact two"], tables: [
    { title: "Transfers", columns: ["Player", "Date"], rows: [["A", "3 Nov"], ["B", "unknown"]] },
    { title: "Other", columns: ["Value"], rows: [["30.5B"]] },
  ] }],
  sourceLinks: [{ label: "Roadmap", url: "https://example.test/" }],
  coverage: { rosterTotal: 2, rosterPages: 1, rosterComplete: true, furnaceComplete: true },
};

for (const foreignKeys of [true, false]) {
  test(`observation projection round trips and replaces atomically with foreign keys ${foreignKeys ? "on" : "off"}`, async () => {
    const client = createClient({ url: "file::memory:" });
    try {
      const db = drizzle(client, { schema });
      await migrate(db, { migrationsFolder: "drizzle/sqlite" });
      await client.execute(`PRAGMA foreign_keys = ${foreignKeys ? "ON" : "OFF"}`);
      expect(await readObservedData(db)).toBeNull();
      await db.transaction((tx) => applyObservedData(tx, original));
      let data = await readObservedData(db);
      for (const key of ["stateNumber", "fetchedAt", "sourceUpdatedAt", "leaderboardDateLabel", "coveredPlayers", "coverage", "sections", "furnace", "furnacePlayers", "upcoming", "sourceLinks"])
        expect(data[key]).toEqual(original[key]);
      expect(data.unmatchedPlayers).toEqual([original.players[1]]);
      // Duplicate anonymous values remain separate; no identity is synthesized.
      expect(data.furnacePlayers).toHaveLength(3);
      const next = structuredClone(original);
      next.sections = [{ id: "castle", title: "Castle", facts: [], tables: [] }];
      next.furnacePlayers = [];
      next.players = [original.players[0]];
      next.upcoming = [];
      await db.transaction((tx) => applyObservedData(tx, next));
      await db.transaction((tx) => applyObservedData(tx, next));
      data = await readObservedData(db);
      expect(data.sections).toEqual(next.sections);
      expect(data.furnacePlayers).toEqual([]);
      expect(data.unmatchedPlayers).toEqual([]);
      expect(data.upcoming).toEqual([]);
      for (const table of ["state_observation_facts", "state_observation_tables", "state_observation_rows", "state_furnace_players", "state_unmatched_players", "state_upcoming_events"])
        expect(Number((await client.execute(`select count(*) as n from ${table}`)).rows[0].n)).toBe(0);
      await expect(db.transaction(async (tx) => { await applyObservedData(tx, original); throw new Error("rollback"); })).rejects.toThrow("rollback");
      expect((await readObservedData(db)).sections).toEqual(next.sections);
      // Exercise parameter-limited batches, including anonymous observations.
      const large = structuredClone(original);
      large.furnacePlayers = Array.from({ length: 1050 }, (_, i) => ({
        chiefId: null, name: null, allianceTag: null, level: 31, power: i, band: "fc1",
      }));
      large.sections[0].tables[0].rows = Array.from({ length: 101 }, (_, i) => [`entry ${i}`, "undated"]);
      await db.transaction((tx) => applyObservedData(tx, large));
      const roundTrip = await readObservedData(db);
      expect(roundTrip.furnacePlayers).toEqual(large.furnacePlayers);
      expect(roundTrip.sections).toEqual(large.sections);
    } finally { client.close(); }
  });
}
