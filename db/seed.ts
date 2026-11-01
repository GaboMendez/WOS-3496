import { generateSeed } from "./seeds/generate";
import { openSeedDatabase, persistSeed } from "./seeds/persist";
import { fingerprint, validateSeed } from "./seeds/validate";
import { tableKeys } from "./seeds/tables";

const args = process.argv.slice(2);
const allowed = new Set(["--reset", "--check", "--dry-run"]);
if (args.length > 1 || args.some((arg) => !allowed.has(arg))) {
  console.error("Usage: bun run db/seed.ts [--dry-run | --check | --reset]");
  process.exitCode = 1;
} else {
  try {
    const bundle = generateSeed();
    validateSeed(bundle);
    if (args.includes("--dry-run")) {
      console.log(
        JSON.stringify(
          {
            mode: "dry-run",
            fingerprint: fingerprint(bundle),
            counts: Object.fromEntries(tableKeys.map((key) => [key, bundle[key].length])),
          },
          null,
          2,
        ),
      );
    } else {
      const url = process.env.DATABASE_URL || "file:data/portal.db";
      const { client, database } = await openSeedDatabase(url, args.includes("--check"));
      try {
        const result = await persistSeed(
          database,
          bundle,
          args.includes("--reset") ? "reset" : args.includes("--check") ? "check" : "seed",
        );
        console.log(JSON.stringify({ database: url, ...result }, null, 2));
      } finally {
        client.close();
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
