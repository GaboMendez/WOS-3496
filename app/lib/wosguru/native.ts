import { eq, sql } from "drizzle-orm";
import type { db as portalDb } from "../../../db";
import { alliances, players, sourceSuppressions, sourceSync, stateSettings, svsCycles } from "../../../db/schema";
import { SOURCE_ID, decodeSnapshot, snapshotSchema, type WosguruSnapshot } from "./model";
import { applyObservedData } from "./observations";

type Transaction = Parameters<Parameters<typeof portalDb.transaction>[0]>[0];

/** Writes only source-owned columns on existing rows. Must run in the publishing transaction. */
export async function applyNativeSnapshot(tx: Transaction, input: WosguruSnapshot) {
  const snapshot = snapshotSchema.parse(input);
  if (snapshot.version !== 2 || !snapshot.coverage?.rosterComplete || !snapshot.coverage.furnaceComplete)
    throw new Error("Only a complete validated roster and furnace snapshot can be imported");
  const tags = snapshot.alliances.map((a) => a.tag);
  const chiefs = snapshot.players.flatMap((p) => p.chiefId ? [p.chiefId] : []);
  const battleDates = snapshot.svs.map((s) => s.date);
  if (new Set(tags).size !== tags.length || new Set(chiefs).size !== chiefs.length || new Set(battleDates).size !== battleDates.length)
    throw new Error("Duplicate alliance tag, Chief ID, or SvS date in snapshot");
  const suppressedRows = await tx.select().from(sourceSuppressions);
  const isSuppressed = (kind: string, key: string) => suppressedRows.some((row) => row.entityKind === kind && row.sourceKey === key);
  let suppressed = 0;

  const existingSettings = await tx.select().from(stateSettings);
  if (existingSettings.length > 1 || (existingSettings[0] && existingSettings[0].stateNumber !== snapshot.stateNumber))
    throw new Error("State settings are ambiguous or belong to another state");
  const stateId = existingSettings[0]?.id ?? `wosguru:state:${snapshot.stateNumber}`;
  if (!existingSettings.length)
    await tx.insert(stateSettings).values({ id: stateId, stateNumber: snapshot.stateNumber, displayName: `State ${snapshot.stateNumber}` });
  const s = snapshot.state;
  await tx.update(stateSettings).set({
    sourceSvsRating: s.svsRating, sourcePrepRating: s.prepRating, sourceCastleRating: s.castleRating,
    sourceGlobalRank: s.globalRank, sourceRankedStates: s.rankedStates, sourceTransferGroup: s.transferGroup,
    sourceTransferGroupRank: s.transferGroupRank, sourceTransferGroupStates: s.transferGroupStates,
    sourceHeroGeneration: s.heroGeneration, sourceFireCrystalLevel: s.fireCrystalLevel,
    sourceTop100Power: s.top100Power, sourceTop100Kills: s.top100Kills,
    sourceTop100Labyrinth: s.top100Labyrinth, sourceTop100TransferScore: s.top100TransferScore,
    sourceTop100TroopsPower: s.top100TroopsPower, sourceTop100TechPower: s.top100TechPower,
    sourceTop100ChiefGearPower: s.top100ChiefGearPower, sourceObservedAt: snapshot.fetchedAt,
  }).where(eq(stateSettings.id, stateId));

  const existingAlliances = await tx.select().from(alliances);
  const mapped = new Map<string, string>();
  const unresolved: string[] = [];
  const allianceEntries: (typeof alliances.$inferInsert)[] = [];
  for (const row of snapshot.alliances) {
    if (isSuppressed("alliance", row.tag)) { suppressed++; continue; }
    const linked = existingAlliances.find((a) => a.sourceAllianceTag === row.tag);
    // A mutable source tag plus a changed source name cannot establish identity.
    if (linked?.sourceName && linked.sourceName !== row.name) {
      unresolved.push(row.tag);
      continue;
    }
    // A matching display tag on an editorial record is not proof of identity.
    if (!linked && existingAlliances.some((a) => a.tag === row.tag)) {
      unresolved.push(row.tag);
      continue;
    }
    const id = linked?.id ?? `wosguru:alliance:${snapshot.stateNumber}:${encodeURIComponent(row.tag)}`;
    allianceEntries.push({ id, name: row.name, tag: row.tag,
      slug: `alliance-${Buffer.from(row.tag).toString("hex")}`, sourceAllianceTag: row.tag,
      sourceManaged: true, kind: "other", power: null, openSpots: null, recruitingStatus: null, published: true,
      sourceName: row.name, sourceRank: row.rank,
      sourcePower: row.power, sourceMembers: row.members, sourceMedianFurnace: row.medianFurnace,
      sourceCastleWins: row.castleWins, sourceObservedAt: snapshot.fetchedAt });
    mapped.set(row.tag, id);
  }
  if (allianceEntries.length) await tx.insert(alliances).values(allianceEntries).onConflictDoUpdate({
    target: alliances.sourceAllianceTag,
    set: { sourceName: sql`excluded.source_name`, sourceRank: sql`excluded.source_rank`,
      sourcePower: sql`excluded.source_power`, sourceMembers: sql`excluded.source_members`,
      sourceMedianFurnace: sql`excluded.source_median_furnace`, sourceCastleWins: sql`excluded.source_castle_wins`,
      sourceObservedAt: sql`excluded.source_observed_at` },
  });

  const entries = snapshot.players.filter((p) => {
    if (!p.chiefId) return false;
    if (isSuppressed("player", p.chiefId)) { suppressed++; return false; }
    return true;
  }).map((p) => ({
    id: `wosguru:player:${p.chiefId}`, chiefId: p.chiefId!, name: p.name,
    allianceId: null,
    sourceManaged: true,
    sourceName: p.name, sourceRank: p.rank, sourceAllianceTag: p.allianceTag,
    sourceAllianceId: p.allianceTag ? mapped.get(p.allianceTag) ?? null : null,
    sourceFurnaceLevel: p.furnaceLevel, sourceNumericFurnaceLevel: p.numericFurnaceLevel,
    sourceFurnaceBand: p.furnaceBand, sourcePower: p.power, sourceExactPower: p.exactPower,
    sourceObservedAt: snapshot.fetchedAt,
  }));
  // Limit SQLite parameters per statement and keep all batches within the transaction.
  for (let i = 0; i < entries.length; i += 30) {
    await tx.insert(players).values(entries.slice(i, i + 30)).onConflictDoUpdate({
      target: players.chiefId,
      set: {
        name: sql`case when ${players.sourceManaged} = 1 and ${players.sourceName} is not null and ${players.name} = ${players.sourceName} then excluded.source_name else ${players.name} end`,
        sourceName: sql`excluded.source_name`, sourceRank: sql`excluded.source_rank`,
        sourceAllianceTag: sql`excluded.source_alliance_tag`, sourceAllianceId: sql`excluded.source_alliance_id`, sourceFurnaceLevel: sql`excluded.source_furnace_level`,
        sourceNumericFurnaceLevel: sql`excluded.source_numeric_furnace_level`, sourceFurnaceBand: sql`excluded.source_furnace_band`,
        sourcePower: sql`excluded.source_power`, sourceExactPower: sql`excluded.source_exact_power`,
        sourceObservedAt: sql`excluded.source_observed_at`,
      },
    });
  }
  const cycles = await tx.select().from(svsCycles);
  let importedBattles = 0;
  const battleEntries: (typeof svsCycles.$inferInsert)[] = [];
  for (const row of snapshot.svs) {
    const id = `wosguru:svs:${snapshot.stateNumber}:${row.date}:${row.opponent}`;
    if (isSuppressed("svs", id)) { suppressed++; continue; }
    const existing = cycles.find((cycle) => cycle.id === id && cycle.sourceManaged);
    if (!existing && cycles.some((cycle) => cycle.eventDate === row.date || cycle.id === id)) {
      unresolved.push(`SvS ${row.date}`);
      continue;
    }
    battleEntries.push({ id, slug: `svs-${row.date}-${row.opponent}`,
      opponent: String(row.opponent), eventDate: row.date, sourceManaged: true, published: true,
      sourceBattleResult: row.result, sourceSide: row.side, sourceObservedAt: snapshot.fetchedAt });
    importedBattles++;
  }
  for (let i = 0; i < battleEntries.length; i += 30) await tx.insert(svsCycles).values(battleEntries.slice(i, i + 30)).onConflictDoUpdate({
    target: svsCycles.id,
    set: { sourceBattleResult: sql`excluded.source_battle_result`, sourceSide: sql`excluded.source_side`,
      sourceObservedAt: sql`excluded.source_observed_at` },
  });
  await applyObservedData(tx, snapshot);
  return { alliances: mapped.size, players: entries.length, missingChiefIds: snapshot.players.filter((p) => !p.chiefId).length,
    battles: importedBattles, suppressed, unresolved };
}

/** Reconcile the existing stored complete snapshot without any source network request. */
export async function backfillNativeSnapshot(db: typeof portalDb, now = Date.now()) {
  return db.transaction(async (tx) => {
    const row = await tx.select().from(sourceSync).where(eq(sourceSync.id, SOURCE_ID)).get();
    if (!row || (row.leaseToken && row.leaseExpiresAt > now)) throw new Error("A source refresh is active or no snapshot exists");
    const snapshot = decodeSnapshot(row.payload);
    if (!snapshot) throw new Error("No valid source snapshot available");
    const result = await applyNativeSnapshot(tx, snapshot);
    await tx.update(sourceSync).set({ nativeIssues: JSON.stringify({ missingChiefIds: result.missingChiefIds, unresolved: result.unresolved, suppressed: result.suppressed }) }).where(eq(sourceSync.id, SOURCE_ID));
    return result;
  });
}
