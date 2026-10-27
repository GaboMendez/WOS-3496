import { createClient } from "@libsql/client";

const client = createClient({ url: process.env.DATABASE_URL || "file:data/portal.db" });

try {
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
  const names = new Set(tables.rows.map((row) => String(row.name)));
  if (!names.has("profiles")) throw new Error("Local database has not been initialized. Run bun run db:migrate first.");

  // A previous drizzle-kit push may leave this empty staging table after a failed copy.
  if (names.has("__new_profiles")) {
    const staged = await client.execute("SELECT count(*) AS count FROM __new_profiles");
    if (Number(staged.rows[0]?.count) !== 0) throw new Error("__new_profiles contains data; inspect it before upgrading.");
    await client.execute("DROP TABLE __new_profiles");
  }

  const columns = await client.execute("PRAGMA table_info(profiles)");
  if (!columns.rows.some((row) => row.name === "password_hash")) {
    await client.execute("ALTER TABLE profiles ADD COLUMN password_hash TEXT");
    console.log("Added profiles.password_hash. Existing accounts need a new local password.");
  } else {
    console.log("Database schema is current.");
  }

  const svsColumns = await client.execute("PRAGMA table_info(svs_cycles)");
  if (svsColumns.rows.some((row) => row.name === "notNull") && !svsColumns.rows.some((row) => row.name === "opponent")) {
    await client.execute('ALTER TABLE svs_cycles RENAME COLUMN "notNull" TO opponent');
    console.log("Renamed SvS opponent column.");
  }
} finally {
  client.close();
}
