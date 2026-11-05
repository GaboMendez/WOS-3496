import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.ts";
import { applyNativeSnapshot, backfillNativeSnapshot } from "../app/lib/wosguru/native.ts";

const cleanup = [];
afterEach(async () => { for (const f of cleanup.splice(0)) await f(); });
const snapshot = () => ({
  version: 2, stateNumber: 3496, fetchedAt: "2026-11-03T00:00:00.000Z", sourceUpdatedAt: "2026-11-02T00:00:00.000Z", leaderboardDateLabel: null,
  state: { svsRating: 1, prepRating: 2, castleRating: 3, globalRank: 4, rankedStates: 5, transferGroup: 6,
    transferGroupRank: 7, transferGroupStates: 8, heroGeneration: 9, fireCrystalLevel: 10, top100Power: 100,
    top100Kills: null, top100Labyrinth: null, top100TransferScore: null, top100TroopsPower: null,
    top100TechPower: null, top100ChiefGearPower: null },
  alliances: [{ rank: 1, tag: "AAA", name: "One", power: 500, members: 90, medianFurnace: "FC1", castleWins: 1 }],
  players: [{ rank: 1, chiefId: "123", name: "First", allianceTag: "AAA", furnaceLevel: "FC1", power: 300, exactPower: 301, numericFurnaceLevel: 31, furnaceBand: "fc1" },
    { rank: 2, chiefId: "124", name: "Other", allianceTag: "UNKNOWN", furnaceLevel: "30", power: 100, exactPower: null, numericFurnaceLevel: null, furnaceBand: null },
    { rank: 3, chiefId: null, name: "Anonymous", allianceTag: null, furnaceLevel: "30", power: 90, exactPower: null, numericFurnaceLevel: null, furnaceBand: null }],
  furnace: [{ band: "fc1", players: 1, label: "FC1", percentage: "100%", levels: [[31, 1]] }], coveredPlayers: 1,
  furnacePlayers: [], svs: [{ date: "2026-10-01", opponent: 1234, side: "attack", result: "win" }],
  upcoming: [], sections: [], sourceLinks: [], coverage: { rosterTotal: 3, rosterPages: 1, rosterComplete: true, furnaceComplete: true },
});
async function memory() {
  const client = createClient({ url: "file::memory:" });
  const db = drizzle(client, { schema });
  cleanup.push(() => client.close());
  await migrate(db, { migrationsFolder: "drizzle/sqlite" });
  return { client, db };
}

test("complete backfill creates native records, preserves edits, retries, and leaves unknown associations empty", async () => {
  const { db } = await memory();
  const first = snapshot();
  await db.insert(schema.sourceSync).values({ id: "wosguru-3496", payload: JSON.stringify(first), status: "ready" });
  const result = await backfillNativeSnapshot(db);
  expect(result).toMatchObject({ alliances: 1, players: 2, missingChiefIds: 1, battles: 1, unresolved: [] });
  expect((await db.select().from(schema.players)).map((p) => p.chiefId).sort()).toEqual(["123", "124"]);
  expect((await db.select().from(schema.players).where(eq(schema.players.chiefId, "124")).get()).sourceAllianceId).toBeNull();
  const a = (await db.select().from(schema.alliances))[0];
  expect(a.published).toBe(true);
  await db.update(schema.players).set({ name: "Admin name", power: 777, allianceId: a.id }).where(eq(schema.players.chiefId, "123"));
  await db.update(schema.alliances).set({ name: "Admin alliance", power: 888, published: false }).where(eq(schema.alliances.id, a.id));
  await db.update(schema.svsCycles).set({ battleResult: "loss", published: false });
  const second = structuredClone(first);
  second.fetchedAt = "2026-11-04T00:00:00.000Z";
  second.players[0].name = "Renamed source";
  second.players[0].allianceTag = null;
  second.players[1].name = "Renamed other";
  second.alliances[0].power = 900;
  await db.update(schema.sourceSync).set({ payload: JSON.stringify(second) });
  await backfillNativeSnapshot(db);
  await backfillNativeSnapshot(db);
  const edited = await db.select().from(schema.players).where(eq(schema.players.chiefId, "123")).get();
  expect(edited).toMatchObject({ name: "Admin name", power: 777, allianceId: a.id, sourceName: "Renamed source", sourceAllianceId: null });
  expect((await db.select().from(schema.players).where(eq(schema.players.chiefId, "124")).get()).name).toBe("Renamed other");
  expect((await db.select().from(schema.alliances))[0]).toMatchObject({ name: "Admin alliance", power: 888, published: false, sourcePower: 900 });
  expect((await db.select().from(schema.svsCycles))[0]).toMatchObject({ battleResult: "loss", published: false, sourceBattleResult: "win" });
  expect(await db.select().from(schema.players)).toHaveLength(2);
});

test("unconfirmed collisions and duplicate input do not guess or partially write", async () => {
  const { db } = await memory();
  await db.insert(schema.alliances).values({ id: "staff", tag: "AAA", name: "Staff", slug: "staff", published: false });
  await db.insert(schema.players).values({ id: "staff-player", chiefId: "123", name: "Staff player", power: 50 });
  const data = snapshot();
  const result = await db.transaction((tx) => applyNativeSnapshot(tx, data));
  expect(result.unresolved).toEqual(["AAA"]);
  const staff = await db.select().from(schema.players).where(eq(schema.players.id, "staff-player")).get();
  expect(staff).toMatchObject({ name: "Staff player", power: 50, sourceAllianceId: null });
  expect(await db.select().from(schema.alliances)).toHaveLength(1);
  data.players[1].chiefId = "123";
  data.state.svsRating = 999;
  await expect(db.transaction((tx) => applyNativeSnapshot(tx, data))).rejects.toThrow("Duplicate");
  expect((await db.select().from(schema.stateSettings))[0].sourceSvsRating).toBe(1);
  data.players[1].chiefId = "124";
  data.alliances.push({ ...data.alliances[0] });
  await expect(db.transaction((tx) => applyNativeSnapshot(tx, data))).rejects.toThrow("Duplicate");
});

test("changed alliance name requires review and does not remap a reused tag", async () => {
  const { db } = await memory();
  const first = snapshot();
  await db.transaction((tx) => applyNativeSnapshot(tx, first));
  const changed = structuredClone(first);
  changed.fetchedAt = "2026-11-04T00:00:00.000Z";
  changed.alliances[0].name = "Different alliance";
  const result = await db.transaction((tx) => applyNativeSnapshot(tx, changed));
  expect(result.unresolved).toEqual(["AAA"]);
  expect((await db.select().from(schema.alliances))[0]).toMatchObject({ name: "One", sourceName: "One" });
  expect((await db.select().from(schema.players).where(eq(schema.players.chiefId, "123")).get()).sourceAllianceId).toBeNull();
});

test("Drizzle upgrade preserves dependent rows with foreign keys enabled", async () => {
  const folder = await mkdtemp(join(tmpdir(), "wos3496-migration-"));
  cleanup.push(() => rm(folder, { recursive: true, force: true }));
  await mkdir(join(folder, "meta"));
  const journal = JSON.parse(await readFile("drizzle/sqlite/meta/_journal.json", "utf8"));
  journal.entries = journal.entries.filter((entry) => entry.idx <= 6);
  await writeFile(join(folder, "meta", "_journal.json"), JSON.stringify(journal));
  for (const entry of journal.entries) await copyFile(`drizzle/sqlite/${entry.tag}.sql`, join(folder, `${entry.tag}.sql`));
  const client = createClient({ url: "file::memory:" });
  cleanup.push(() => client.close());
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: folder });
  await client.execute("PRAGMA foreign_keys=ON");
  await client.execute("INSERT INTO alliances (id,name,slug,tag) VALUES ('a','A','a','A')");
  await client.execute("INSERT INTO players (id,chief_id,alliance_id,name) VALUES ('p','123','a','Player'), ('q',NULL,'a','No ID'), ('r',NULL,'a','No ID 2')");
  await client.execute("INSERT INTO ranking_snapshots (id,name,metric,subject_kind,captured_at) VALUES ('s','Rank','power','player','2026-01-01')");
  await client.execute("INSERT INTO ranking_entries (id,snapshot_id,player_id,rank,value) VALUES ('e','s','p',1,100)");
  await migrate(db, { migrationsFolder: "drizzle/sqlite" });
  expect((await client.execute("PRAGMA foreign_key_check")).rows).toHaveLength(0);
  expect((await client.execute("SELECT id, name, alliance_id FROM players ORDER BY id")).rows).toHaveLength(3);
  expect((await client.execute("SELECT player_id FROM ranking_entries")).rows[0].player_id).toBe("p");
  expect((await client.execute("SELECT source_name FROM players WHERE id = 'p'")).rows[0].source_name).toBeNull();
});
