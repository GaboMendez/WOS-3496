import { readFile } from "node:fs/promises";
import { parseStatePage } from "../app/lib/wosguru/parser";
import { SOURCE_ID, decodeSnapshot } from "../app/lib/wosguru/model";
import { sourceSync } from "../db/schema";
import { eq } from "drizzle-orm";

const args = process.argv.slice(2);
if (args[0] === "--file" && args.length === 2) {
  // Offline parser preview only. A saved file never changes the stored snapshot.
  const snapshot = parseStatePage(await readFile(args[1], "utf8"));
  console.log(
    JSON.stringify(
      {
        sourceUpdatedAt: snapshot.sourceUpdatedAt,
        state: snapshot.state,
        alliances: snapshot.alliances.length,
        players: snapshot.players.length,
        svsCycles: snapshot.svs.length,
        coveredPlayers: snapshot.coveredPlayers,
        coverage: snapshot.coverage,
        sections: snapshot.sections.map((section) => ({
          id: section.id,
          tables: section.tables.map((table) => ({ title: table.title, rows: table.rows.length })),
        })),
      },
      null,
      2,
    ),
  );
} else if (args.length === 1 && args[0] === "--backfill-native") {
  const { db } = await import("../db");
  const { backfillNativeSnapshot } = await import("../app/lib/wosguru/native");
  try {
    console.log(JSON.stringify(await backfillNativeSnapshot(db), null, 2));
  } finally {
    db.$client.close();
  }
} else if (!args.length || (args.length === 1 && args[0] === "--status")) {
  if (process.env.WOSGURU_SYNC_ENABLED === "false")
    throw new Error("State data refresh is disabled.");
  const { db } = await import("../db");
  const { syncWosguru } = await import("../app/lib/wosguru/sync");
  try {
    if (args[0] !== "--status") {
      for (let batch = 0; batch < 30; batch++) {
        const result = await syncWosguru(db);
        console.log(JSON.stringify(result, null, 2));
        if (result.status === "failed") process.exitCode = 1;
        if (result.status !== "collecting") break;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, result.nextAllowedAt - Date.now() + 25)),
        );
        if (batch === 29) {
          console.error("Collection checkpoint saved; run again to continue.");
          process.exitCode = 1;
        }
      }
    }
    const row = await db.select().from(sourceSync).where(eq(sourceSync.id, SOURCE_ID)).get();
    const data = decodeSnapshot(row?.payload ?? null);
    console.log(
      JSON.stringify(
        {
          status: row?.status ?? "idle",
          version: data?.version ?? null,
          nextAllowedAt: row?.nextAllowedAt ? new Date(row.nextAllowedAt).toISOString() : null,
          pending: !!row?.pendingPayload,
          nativeIssues: row?.nativeIssues ? JSON.parse(row.nativeIssues) : null,
          coverage: data?.coverage ?? null,
          players: data?.players.length ?? 0,
          furnaceRecords: data?.furnacePlayers.length ?? 0,
          sections:
            data?.sections.map((section) => ({
              id: section.id,
              tables: section.tables.map((table) => ({
                title: table.title,
                rows: table.rows.length,
              })),
            })) ?? [],
        },
        null,
        2,
      ),
    );
  } finally {
    db.$client.close();
  }
} else {
  throw new Error("Usage: bun.exe run data:sync [--file <saved-state.html> | --status | --backfill-native]");
}
