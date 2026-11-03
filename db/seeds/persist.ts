import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { getTableColumns, inArray, sql } from "drizzle-orm";
import { access, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import * as schema from "../schema";
import { generateSeed } from "./generate";
import { seedTables, tableKeys, type SeedData, type SeedTable } from "./tables";
import { fingerprint, validateSeed } from "./validate";

export type SeedDatabase = LibSQLDatabase<typeof schema>;

export async function openSeedDatabase(url: string, mustExist = false) {
  if (url.startsWith("file:") && url !== "file::memory:") {
    if (mustExist) await access(resolve(url.slice(5)));
    else await mkdir(dirname(resolve(url.slice(5))), { recursive: true });
  }
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  await client.execute("PRAGMA foreign_keys = ON");
  return { client, database: drizzle(client, { schema }) };
}

export async function readSeed(
  database: SeedDatabase,
  expected = generateSeed(),
): Promise<SeedData> {
  const actual = {} as SeedData;
  for (const key of tableKeys) {
    const ids = expected[key].map((row) => row.id);
    const rows = ids.length
      ? await database
          .select()
          .from(seedTables[key])
          .where(inArray(getTableColumns(seedTables[key]).id, ids))
      : [];
    const byId = new Map(rows.map((row) => [String(row.id), row]));
    (actual as Record<string, unknown>)[key] = ids.flatMap((id) =>
      byId.has(id) ? [byId.get(id)] : [],
    );
  }
  return actual;
}

export async function persistSeed(
  database: SeedDatabase,
  data: SeedData,
  mode: "seed" | "reset" | "check" = "seed",
) {
  validateSeed(data);
  if (mode === "check") {
    const actual = await readSeed(database, data);
    validateSeed(actual);
    if (fingerprint(actual) !== fingerprint(data))
      throw new Error("Seeded records differ from the seed data. Run db:seed to restore them.");
  } else
    await database.transaction(async (tx) => {
      if (mode === "reset") {
        const links = [
          ["allianceLeaders", "allianceId", "alliances"],
          ["allianceEvents", "allianceId", "alliances"],
          ["governanceSections", "documentId", "governanceDocuments"],
          ["svsStoryMetrics", "cycleId", "svsCycles"],
        ] as const;
        for (const [child, column, parent] of links) {
          const ids = data[parent].map((row) => row.id);
          if (!ids.length) continue;
          const columns = getTableColumns(seedTables[child]);
          const rows = await tx
            .select({ id: columns.id })
            .from(seedTables[child])
            .where(inArray(columns[column as keyof typeof columns], ids));
          if (rows.some((row) => !data[child].some((seed) => seed.id === row.id)))
            throw new Error(
              `Cannot reset: ${child} contains additional records linked to seeded data.`,
            );
        }
      }
      if (mode === "reset")
        for (const key of [...tableKeys].reverse()) {
          const ids = data[key].map((row) => row.id);
          if (ids.length)
            await tx
              .delete(seedTables[key])
              .where(inArray(getTableColumns(seedTables[key]).id, ids));
        }
      for (const key of tableKeys) {
        const columns = getTableColumns(seedTables[key]);
        const updates = Object.fromEntries(
          Object.entries(columns)
            .filter(([name]) => name !== "id")
            .map(([name, column]) => [name, sql`excluded.${sql.identifier(column.name)}`]),
        );
        const rows: SeedData[SeedTable][number][] = data[key];
        for (let offset = 0; offset < rows.length; offset += 50)
          await tx
            .insert(seedTables[key])
            .values(rows.slice(offset, offset + 50))
            .onConflictDoUpdate({ target: columns.id, set: updates });
      }
      const actual = await readSeed(tx as unknown as SeedDatabase, data);
      if (fingerprint(actual) !== fingerprint(data))
        throw new Error("Seed verification failed; changes were rolled back.");
      if ((await tx.all(sql`PRAGMA foreign_key_check`)).length)
        throw new Error("Foreign-key validation failed.");
    });
  return {
    counts: Object.fromEntries(tableKeys.map((key) => [key, data[key].length])),
    fingerprint: fingerprint(data),
  };
}
