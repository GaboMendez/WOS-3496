import { afterAll, expect, mock, test } from "bun:test";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import * as schema from "../db/schema.ts";
import { backfillNativeSnapshot } from "../app/lib/wosguru/native.ts";

process.env.DATABASE_URL = "file::memory:";
delete process.env.TURSO_AUTH_TOKEN;
mock.module("server-only", () => ({}));
mock.module("@/lib/auth", () => ({ getCurrentUser: async () => ({ isStaff: true, isAdmin: true }) }));
const { db } = await import("../db/index");
const { DELETE, POST, PATCH } = await import("../app/api/admin/[resource]/route");
await migrate(db, { migrationsFolder: "drizzle/sqlite" });
afterAll(() => { mock.restore(); db.$client.close(); });
const request = (method, body) => new NextRequest("http://localhost/api/admin/x", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const context = (resource) => ({ params: Promise.resolve({ resource }) });

test("admin deletion suppresses re-import; removing suppression restores on next refresh", async () => {
  const snapshot = {
    version: 2, stateNumber: 3496, fetchedAt: "2026-11-03T00:00:00.000Z", sourceUpdatedAt: "2026-11-02T00:00:00.000Z", leaderboardDateLabel: null,
    state: { svsRating: 1, prepRating: 2, castleRating: 3, globalRank: 4, rankedStates: 5, transferGroup: 6, transferGroupRank: 7, transferGroupStates: 8,
      heroGeneration: null, fireCrystalLevel: null, top100Power: 100, top100Kills: null, top100Labyrinth: null, top100TransferScore: null,
      top100TroopsPower: null, top100TechPower: null, top100ChiefGearPower: null },
    alliances: [{ rank: 1, tag: "AAA", name: "Alliance", power: 100, members: 1, medianFurnace: "FC1", castleWins: null }],
    players: [{ rank: 1, chiefId: "123", name: "Player", allianceTag: "AAA", furnaceLevel: "FC1", power: 100 }],
    furnace: [{ band: "fc1", players: 1, label: "FC1", percentage: "100%", levels: [[31, 1]] }],
    furnacePlayers: [], coveredPlayers: 1, svs: [{ date: "2026-10-01", opponent: 100, side: "attack", result: "win" }], upcoming: [], sections: [], sourceLinks: [],
    coverage: { rosterTotal: 1, rosterPages: 1, rosterComplete: true, furnaceComplete: true },
  };
  await db.insert(schema.sourceSync).values({ id: "wosguru-3496", payload: JSON.stringify(snapshot) });
  await backfillNativeSnapshot(db);
  const alliance = (await db.select().from(schema.alliances))[0];
  const player = (await db.select().from(schema.players))[0];
  const cycle = (await db.select().from(schema.svsCycles))[0];
  expect(player.sourceAllianceId).toBe(alliance.id);

  // Staff-maintained assignments prevent deletion, with no partial suppression.
  await db.update(schema.players).set({ allianceId: alliance.id }).where(eq(schema.players.id, player.id));
  expect((await DELETE(request("DELETE", { id: alliance.id }), context("alliances"))).status).toBe(400);
  expect(await db.select().from(schema.sourceSuppressions)).toHaveLength(0);
  expect((await db.select().from(schema.players))[0].sourceAllianceId).toBe(alliance.id);
  await db.update(schema.players).set({ allianceId: null }).where(eq(schema.players.id, player.id));

  expect((await DELETE(request("DELETE", { id: alliance.id }), context("alliances"))).status).toBe(200);
  expect((await db.select().from(schema.players))[0].sourceAllianceId).toBeNull();
  expect((await DELETE(request("DELETE", { id: player.id }), context("players"))).status).toBe(200);
  expect((await DELETE(request("DELETE", { id: cycle.id }), context("svs_cycles"))).status).toBe(200);
  expect(await db.select().from(schema.sourceSuppressions)).toHaveLength(3);
  await backfillNativeSnapshot(db);
  expect(await db.select().from(schema.alliances)).toHaveLength(0);
  expect(await db.select().from(schema.players)).toHaveLength(0);
  expect(await db.select().from(schema.svsCycles)).toHaveLength(0);

  const suppressed = await db.select().from(schema.sourceSuppressions);
  expect((await POST(request("POST", {}), context("source_suppressions"))).status).toBe(403);
  expect((await PATCH(request("PATCH", {}), context("source_suppressions"))).status).toBe(403);
  for (const row of suppressed) expect((await DELETE(request("DELETE", { id: row.id }), context("source_suppressions"))).status).toBe(200);
  await backfillNativeSnapshot(db);
  expect(await db.select().from(schema.alliances)).toHaveLength(1);
  expect(await db.select().from(schema.players)).toHaveLength(1);
  expect(await db.select().from(schema.svsCycles)).toHaveLength(1);
});
