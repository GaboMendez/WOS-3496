import { z } from "zod";
import { parseRosterRows } from "./parser";
import { furnacePlayerSchema, snapshotSchema, type SourceCollection } from "./model";

const integer = z.number().int().nonnegative().max(10000);
const pageSchema = z.object({
  total: integer,
  page: integer.positive(),
  per: integer.positive(),
  pages: integer.positive(),
});

export function collectionComplete(job: SourceCollection) {
  return !!job.snapshot.coverage?.rosterComplete && job.furnaceBand >= job.snapshot.furnace.length;
}

export function nextCollectionPath(job: SourceCollection): string | null {
  if (!job.snapshot.coverage?.rosterComplete)
    return `/api/state/3496/players?lang=en&q=&page=${job.rosterPage}`;
  const band = job.snapshot.furnace[job.furnaceBand];
  if (!band) return null;
  if (!/^[a-z0-9]+$/.test(band.band)) throw new Error("Unexpected furnace band identifier");
  return `/api/state/3496/furnace?lang=en&band=${encodeURIComponent(band.band)}&page=${job.furnacePage}`;
}

export function appendCollectionPage(job: SourceCollection, input: unknown) {
  const coverage = job.snapshot.coverage;
  if (!coverage) throw new Error("Source coverage metadata is missing");
  const page = pageSchema.parse(input);
  if (page.per !== 50 || page.pages !== Math.max(1, Math.ceil(page.total / page.per)))
    throw new Error("Source pagination changed");
  const expectedRows = Math.min(50, page.total - (page.page - 1) * 50);
  if (!coverage.rosterComplete) {
    const result = pageSchema.extend({ html: z.string().max(1024 * 1024) }).parse(input);
    if (page.page !== job.rosterPage || page.total !== coverage.rosterTotal)
      throw new Error("Roster changed during collection");
    const rows = parseRosterRows(result.html);
    if (
      rows.length !== expectedRows ||
      rows.some((row, index) => row.rank !== (page.page - 1) * 50 + index + 1)
    )
      throw new Error("Incomplete or repeated source roster page");
    job.snapshot.players.push(...rows);
    job.rosterPage++;
    coverage.rosterComplete = job.snapshot.players.length === coverage.rosterTotal;
  } else {
    const result = pageSchema
      .extend({
        rows: z.array(
          z.tuple([
            z.string().nullable(),
            z.string().nullable(),
            z.number().int(),
            z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
            z.string().nullable(),
          ]),
        ),
      })
      .parse(input);
    const band = job.snapshot.furnace[job.furnaceBand];
    if (
      !band ||
      page.page !== job.furnacePage ||
      page.total !== band.players ||
      result.rows.length !== expectedRows
    )
      throw new Error("Furnace roster changed during collection");
    const rows = result.rows.map(([name, allianceTag, level, power, path]) => {
      if (path && !/^\/player\/\d{1,20}$/.test(path))
        throw new Error("Unexpected chief identity path");
      if (!band.levels.some(([value]) => value === level))
        throw new Error("Player furnace level does not match the requested band");
      return furnacePlayerSchema.parse({
        name,
        allianceTag,
        level,
        power,
        chiefId: path?.split("/").pop() ?? null,
        band: band.band,
      });
    });
    job.snapshot.furnacePlayers.push(...rows);
    if (page.page === page.pages) {
      job.furnaceBand++;
      job.furnacePage = 1;
    } else job.furnacePage++;
    coverage.furnaceComplete = job.furnaceBand === job.snapshot.furnace.length;
  }
}

export function finishCollection(job: SourceCollection) {
  if (!collectionComplete(job) || !job.snapshot.coverage)
    throw new Error("Collection is incomplete");
  const data = job.snapshot;
  if (
    data.players.length !== data.coverage!.rosterTotal ||
    data.furnacePlayers.length !== data.coveredPlayers
  )
    throw new Error("Source coverage totals do not match collected rows");
  const chiefIds = data.players.flatMap((row) => (row.chiefId ? [row.chiefId] : []));
  const furnaceIds = data.furnacePlayers.flatMap((row) => (row.chiefId ? [row.chiefId] : []));
  if (new Set(chiefIds).size !== chiefIds.length || new Set(furnaceIds).size !== furnaceIds.length)
    throw new Error("Duplicate chiefs across source pages");
  for (const band of data.furnace) {
    for (const [level, expected] of band.levels) {
      if (
        data.furnacePlayers.filter((row) => row.band === band.band && row.level === level)
          .length !== expected
      )
        throw new Error("Collected furnace counts changed");
    }
  }
  const exact = new Map(
    data.furnacePlayers.flatMap((row) => (row.chiefId ? [[row.chiefId, row] as const] : [])),
  );
  for (const player of data.players) {
    const source = player.chiefId ? exact.get(player.chiefId) : null;
    if (source) {
      player.exactPower = source.power;
      player.numericFurnaceLevel = source.level;
      player.furnaceBand = source.band;
    }
  }
  return snapshotSchema.parse(data);
}
