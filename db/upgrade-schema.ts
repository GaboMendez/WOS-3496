import type { Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { fileURLToPath } from "node:url";
import baseline from "../drizzle/sqlite/meta/0000_snapshot.json";

const migrationsFolder = fileURLToPath(new URL("../drizzle/sqlite", import.meta.url));

/** Adopt the baseline only after checking the legacy schema; then use the normal Drizzle journal. */
export async function migrateLegacyDatabase(client: Client) {
  await client.execute("PRAGMA foreign_keys = ON");
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
  const names = new Set(tables.rows.map((row) => String(row.name)));
  const history = names.has("__drizzle_migrations")
    ? await client.execute("SELECT count(*) AS count FROM __drizzle_migrations")
    : null;
  if (!history || Number(history.rows[0]?.count) === 0) {
    for (const table of Object.values(baseline.tables)) {
      if (!names.has(table.name))
        throw new Error(
          `Cannot adopt legacy database: missing table ${table.name}. Inspect the schema before migrating.`,
        );
      const columns = await client.execute(`PRAGMA table_info("${table.name}")`);
      for (const column of Object.values(table.columns)) {
        const existing = columns.rows.find((row) => row.name === column.name);
        if (!existing || String(existing.type).toLowerCase() !== column.type)
          throw new Error(
            `Cannot adopt legacy database: incompatible ${table.name}.${column.name}.`,
          );
      }
    }
    const initial = readMigrationFiles({ migrationsFolder })[0];
    await client.batch(
      [
        "CREATE TABLE IF NOT EXISTS __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)",
        {
          sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
          args: [initial.hash, initial.folderMillis],
        },
      ],
      "write",
    );
  }
  await migrate(drizzle(client), { migrationsFolder });
}
