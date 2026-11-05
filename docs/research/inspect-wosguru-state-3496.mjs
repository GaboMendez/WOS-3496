// Offline research only: no network requests, application imports, or database writes.
import { readFile, stat } from "node:fs/promises";

const SOURCE = "https://wosguru.com/state/3496";
const FURNACE_API = "/api/state/3496/furnace?lang=en";
const PLAYERS_API = "/api/state/3496/players?lang=en";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function readSmallFile(path) {
  check((await stat(path)).size <= 2 * 1024 * 1024, "Input exceeds the 2 MiB research limit");
  return (await readFile(path, "utf8")).replace(/^\uFEFF/, "");
}

function attribute(tag, name) {
  return new RegExp(`\\b${name}=["']([^"']*)["']`, "i").exec(tag)?.[1];
}

function furnaceLabel(level) {
  if (level <= 30) return String(level);
  if (level < 35) return `30-${level - 30}`;
  const tier = Math.floor((level - 35) / 5) + 1;
  const step = (level - 35) % 5;
  return `FC${tier}${step ? `-${step}` : ""}`;
}

async function main() {
  const [htmlPath, furnacePath, ...extra] = process.argv.slice(2);
  check(
    htmlPath && !extra.length,
    "Usage: bun.exe docs/research/inspect-wosguru-state-3496.mjs <saved-state.html> [saved-furnace.json]",
  );
  const html = await readSmallFile(htmlPath);
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag);
  check(
    links.some((tag) => attribute(tag, "rel") === "canonical" && attribute(tag, "href") === SOURCE),
    "Expected the canonical public State 3496 page; error/challenge pages are rejected",
  );

  // Narrow inspection of known JSON script blocks; scripts are never executed.
  // This is deliberately not a general HTML scraper or a production parser.
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  const metadata = scripts
    .filter(([, attrs]) => attribute(attrs, "type") === "application/ld+json")
    .map(([, , body]) => JSON.parse(body));
  const page = metadata.find((item) => item["@type"] === "WebPage" && item.url === SOURCE);
  check(page?.name === "State 3496", "Expected State 3496 WebPage metadata");
  const furnaceScript = scripts.find(
    ([, attrs]) =>
      attribute(attrs, "type") === "application/json" &&
      attribute(attrs, "class")?.split(/\s+/).includes("fcc-data"),
  );
  check(furnaceScript, "Expected the embedded furnace configuration");
  const furnace = JSON.parse(furnaceScript[2]);
  check(
    furnace.api === FURNACE_API && furnace.bands && typeof furnace.bands === "object",
    "Furnace configuration changed",
  );
  const rosterTag = [...html.matchAll(/<section\b[^>]*>/gi)].find(
    ([tag]) => attribute(tag, "id") === "roster",
  )?.[0];
  check(rosterTag && attribute(rosterTag, "data-api") === PLAYERS_API, "Roster endpoint changed");

  const bands = Object.fromEntries(
    Object.entries(furnace.bands).map(([band, data]) => {
      check(Array.isArray(data.levels), `Missing levels for ${band}`);
      return [
        band,
        data.levels.reduce((sum, row) => {
          check(
            Array.isArray(row) &&
              row.length === 2 &&
              row.every(Number.isSafeInteger) &&
              row.every((n) => n >= 0),
            `Invalid furnace count for ${band}`,
          );
          return sum + row[1];
        }, 0),
      ];
    }),
  );
  const result = {
    sourceUrl: SOURCE,
    metadataDateModified: page.dateModified,
    sectionDates: [
      ...new Set(
        [...html.matchAll(/<time\b[^>]*datetime=["']([^"']+)["']/gi)].map((match) => match[1]),
      ),
    ],
    advertisedEndpoints: { furnace: furnace.api, players: PLAYERS_API },
    furnaceBandCounts: bands,
    coveredPlayers: Object.values(bands).reduce((sum, count) => sum + count, 0),
    svsCycleCount: new Set(
      [...html.matchAll(/\bid=["']c-(\d{4}-\d{2}-\d{2})["']/g)].map((match) => match[1]),
    ).size,
  };

  if (furnacePath) {
    const sample = JSON.parse(await readSmallFile(furnacePath));
    check(
      [sample.total, sample.page, sample.per, sample.pages].every(
        (n) => Number.isSafeInteger(n) && n > 0,
      ),
      "Invalid pagination metadata",
    );
    check(
      sample.page === 1 &&
        sample.per === 50 &&
        sample.total === bands.fc8 &&
        sample.pages === Math.ceil(sample.total / sample.per),
      "Expected one first-page FC8 sample matching this saved HTML",
    );
    check(
      Array.isArray(sample.rows) && sample.rows.length === Math.min(sample.per, sample.total),
      "Unexpected sample row count",
    );
    for (const row of sample.rows) {
      check(Array.isArray(row) && row.length === 5, "Player tuple schema changed");
      check(
        (row[0] === null || typeof row[0] === "string") &&
          (row[1] === null || typeof row[1] === "string"),
        "Invalid player name or alliance tag",
      );
      check(
        row[2] === 70 && Number.isSafeInteger(row[3]) && row[3] >= 0,
        "Invalid FC8 level or power",
      );
      check(
        row[4] === null || (typeof row[4] === "string" && /^\/player\/\d+$/.test(row[4])),
        "Unexpected player URL",
      );
    }
    const row = sample.rows[0];
    result.endpointSample = {
      page: sample.page,
      per: sample.per,
      total: sample.total,
      pages: sample.pages,
      validatedRows: sample.rows.length,
      // One record demonstrates mapping without publishing a roster.
      firstPlayerMapping: {
        chiefId: row[4]?.split("/").pop() ?? null,
        name: row[0],
        allianceTag: row[1],
        furnaceLevel: furnaceLabel(row[2]),
        power: row[3],
      },
    };
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Research inspection failed: ${error.message}\n`);
  process.exitCode = 1;
});
