import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { resolve, join, sep } from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { generateSeed } from "./generate";
import { fingerprint, validateSeed } from "./validate";
import { openSeedDatabase, persistSeed, readSeed } from "./persist";
import * as schema from "../schema";

test("State 3496 data is stored in the application tables", { timeout: 120000 }, async () => {
  const data = generateSeed();
  validateSeed(data);
  assert.equal(fingerprint(data), fingerprint(generateSeed()));
  assert.equal(data.players.length, 11);
  assert.equal(data.svsCycles.filter((cycle) => cycle.battleResult === "win").length, 7);
  assert.equal(data.svsCycles.filter((cycle) => cycle.battleResult === "loss").length, 4);
  assert.equal(data.alliances.find((alliance) => alliance.tag === "GOS")?.slug, "gos");
  const root = resolve("data");
  await mkdir(root, { recursive: true });
  const folder = await mkdtemp(join(root, "seed-test-"));
  const { client, database } = await openSeedDatabase(
    `file:${join(folder, "test.db").replaceAll("\\", "/")}`,
  );
  try {
    await migrate(database, { migrationsFolder: resolve("drizzle/sqlite") });
    await database.insert(schema.profiles).values({
      id: "existing-account",
      email: "staff@example.invalid",
      passwordHash: "keep-this-hash",
    });
    await database
      .insert(schema.userRoles)
      .values({ id: "existing-role", userId: "existing-account", role: "admin" });
    await database
      .insert(schema.announcements)
      .values({ id: "editorial", title: "Keep this notice" });
    await persistSeed(database, data);
    await persistSeed(database, data);
    await persistSeed(database, data, "check");
    assert.equal((await database.select().from(schema.players)).length, 11);
    const zarc = (
      await database.select().from(schema.players).where(eq(schema.players.name, "zarc"))
    )[0];
    assert.equal(zarc.allianceId, "3496-alliance-gos");
    assert.equal(zarc.power, 844000000);
    assert.equal(zarc.rankTitle, null);
    assert.equal(zarc.kills, null);
    assert.equal((await database.select().from(schema.stateSettings))[0].top100Power, 46100000000);
    await database.update(schema.players).set({ power: 1 }).where(eq(schema.players.id, zarc.id));
    await assert.rejects(persistSeed(database, data, "check"));
    await persistSeed(database, data);
    await persistSeed(database, data, "reset");
    assert.equal((await database.select().from(schema.profiles))[0].passwordHash, "keep-this-hash");
    assert.equal((await database.select().from(schema.userRoles))[0].role, "admin");
    assert.equal(
      (
        await database
          .select()
          .from(schema.announcements)
          .where(eq(schema.announcements.id, "editorial"))
      ).length,
      1,
    );
    await database
      .insert(schema.allianceEvents)
      .values({ id: "editorial-event", allianceId: "3496-alliance-gos", name: "Keep event" });
    await assert.rejects(persistSeed(database, data, "reset"), /additional records/);
    assert.equal(fingerprint(await readSeed(database)), fingerprint(data));
    await database
      .delete(schema.allianceEvents)
      .where(eq(schema.allianceEvents.id, "editorial-event"));
    assert.equal((await client.execute("PRAGMA foreign_key_check")).rows.length, 0);
    assert.equal(
      (
        await client.execute(
          "SELECT name FROM sqlite_master WHERE name IN ('state_snapshots', 'seed_records')",
        )
      ).rows.length,
      0,
    );

    // Existing relational rows also survive the nullable-field migration.
    const legacy = await openSeedDatabase(
      `file:${join(folder, "legacy.db").replaceAll("\\", "/")}`,
    );
    try {
      const migrations = readMigrationFiles({ migrationsFolder: resolve("drizzle/sqlite") });
      await legacy.client.batch(
        migrations.slice(0, -1).flatMap((migration) => migration.sql),
        "write",
      );
      await legacy.client.execute(
        "INSERT INTO alliances (id, name, slug, tag) VALUES ('original', 'Original', 'original', 'OLD')",
      );
      await legacy.client.execute(
        "INSERT INTO players (id, alliance_id, name, rank_title, furnace_level, power, activity_status, account_kind) VALUES ('original-player', 'original', 'Original player', 'R5', 'FC8', 100, 'active', 'main')",
      );
      await legacy.client.execute(
        "INSERT INTO alliances (id, name, slug, tag) VALUES ('old-fixture', 'Old fixture', 'old-fixture', 'OLD2')",
      );
      await legacy.client.execute(
        "INSERT INTO seed_records (id, dataset, table_name, record_id, origin, observed_at, note) VALUES ('old-owner', 'wos3496-demo-v1', 'alliances', 'old-fixture', 'simulated', '2026-10-29', 'old seed')",
      );
      await legacy.client.execute(
        "INSERT INTO alliance_events (id, alliance_id, name) VALUES ('keep-related-event', 'old-fixture', 'Edited event')",
      );
      await assert.rejects(legacy.client.migrate(migrations.at(-1)!.sql));
      assert.equal(
        (await legacy.client.execute("SELECT count(*) AS n FROM alliances WHERE id='old-fixture'"))
          .rows[0].n,
        1,
      );
      await legacy.client.execute("DELETE FROM alliance_events WHERE id='keep-related-event'");
      await legacy.client.migrate(migrations.at(-1)!.sql);
      assert.equal(
        (await legacy.database.select().from(schema.players))[0].name,
        "Original player",
      );
      assert.equal((await legacy.client.execute("PRAGMA foreign_key_check")).rows.length, 0);
    } finally {
      legacy.client.close();
    }
  } finally {
    client.close();
    assert.ok(resolve(folder).startsWith(`${root}${sep}seed-test-`));
    await rm(folder, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== "EBUSY") throw error;
      },
    );
  }
});
