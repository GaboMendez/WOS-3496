import { z } from "zod";

export const SOURCE_ID = "wosguru-3496";
export const SOURCE_URL = "https://wosguru.com/state/3496";
export const PARSER_VERSION = 2;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const positive = count.positive();
const label = z.string().trim().min(1).max(200);

export const playerSchema = z.object({
  rank: positive.max(10000),
  chiefId: z
    .string()
    .regex(/^\d{1,20}$/)
    .nullable(),
  name: label,
  allianceTag: label.max(20).nullable(),
  furnaceLevel: z.string().max(20),
  power: count,
  exactPower: count.nullable().default(null),
  numericFurnaceLevel: count.nullable().default(null),
  furnaceBand: z.string().max(20).nullable().default(null),
});

export const furnacePlayerSchema = z.object({
  name: z.string().max(200).nullable(),
  allianceTag: z.string().max(20).nullable(),
  level: count.max(200),
  power: count,
  chiefId: z
    .string()
    .regex(/^\d{1,20}$/)
    .nullable(),
  band: label.max(20),
});

const sourceTableSchema = z.object({
  title: label,
  columns: z.array(label).min(1).max(15),
  rows: z.array(z.array(z.string().max(1000)).max(15)).max(10000),
});
const sourceSectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: label,
  facts: z.array(z.string().max(1200)).max(40),
  tables: z.array(sourceTableSchema).max(15),
});

export const snapshotSchema = z.object({
  version: z.union([z.literal(1), z.literal(PARSER_VERSION)]),
  stateNumber: z.literal(3496),
  fetchedAt: z.string().datetime(),
  sourceUpdatedAt: z.string().datetime(),
  leaderboardDateLabel: z.string().max(60).nullable(),
  state: z.object({
    svsRating: positive,
    prepRating: positive,
    castleRating: positive,
    globalRank: positive,
    rankedStates: positive,
    transferGroup: positive,
    transferGroupRank: positive,
    transferGroupStates: positive,
    heroGeneration: positive.nullable(),
    fireCrystalLevel: positive.nullable(),
    top100Power: positive,
    top100Kills: count.nullable(),
    top100Labyrinth: count.nullable(),
    top100TransferScore: count.nullable(),
    top100TroopsPower: count.nullable(),
    top100TechPower: count.nullable(),
    top100ChiefGearPower: count.nullable(),
  }),
  alliances: z
    .array(
      z.object({
        rank: positive,
        tag: label.max(20),
        name: label,
        power: count,
        members: count.max(1000),
        medianFurnace: label.max(20),
        castleWins: count.nullable().default(null),
      }),
    )
    .min(1)
    .max(20),
  players: z.array(playerSchema).min(1).max(10000),
  furnace: z
    .array(
      z.object({
        band: label.max(20),
        players: count,
        label: z.string().max(40).default(""),
        percentage: z.string().max(20).default(""),
        levels: z.array(z.tuple([count, count])).default([]),
      }),
    )
    .min(1)
    .max(30),
  coveredPlayers: positive,
  svs: z
    .array(
      z.object({
        date: z.string().date(),
        opponent: positive,
        side: z.enum(["attack", "defense"]),
        result: z.enum(["win", "loss"]),
      }),
    )
    .min(1)
    .max(100),
  upcoming: z
    .array(
      z.object({
        dateLabel: label.max(40),
        title: label,
        relativeLabel: z.string().max(40).default(""),
      }),
    )
    .max(20),
  sections: z.array(sourceSectionSchema).max(30).default([]),
  sourceLinks: z
    .array(z.object({ label, url: z.string().url() }))
    .max(30)
    .default([]),
  furnacePlayers: z.array(furnacePlayerSchema).max(10000).default([]),
  coverage: z
    .object({
      rosterTotal: count.max(10000),
      rosterPages: positive.max(200),
      rosterComplete: z.boolean(),
      furnaceComplete: z.boolean(),
    })
    .nullable()
    .default(null),
});

export type WosguruSnapshot = z.infer<typeof snapshotSchema>;
export type SourceSection = WosguruSnapshot["sections"][number];
export type SourceTable = SourceSection["tables"][number];
export type SourcePlayer = z.infer<typeof playerSchema>;

export const collectionSchema = z.object({
  snapshot: snapshotSchema,
  startedAt: count,
  rosterPage: positive.max(201),
  furnaceBand: count.max(30),
  furnacePage: positive.max(201),
});
export type SourceCollection = z.infer<typeof collectionSchema>;

export function decodeSnapshot(payload: string | null): WosguruSnapshot | null {
  if (!payload) return null;
  try {
    const parsed = snapshotSchema.safeParse(JSON.parse(payload));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
