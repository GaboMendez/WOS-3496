import { and, eq, lte, or, sql } from "drizzle-orm";
import type { db as portalDb } from "../../../db";
import { sourceSync } from "../../../db/schema";
import {
  SOURCE_ID,
  SOURCE_URL,
  collectionSchema,
  decodeSnapshot,
  type SourceCollection,
} from "./model";
import { parseStatePage } from "./parser";
import { DAY, HOUR, SourceError, fetchText, robotsAllowsState } from "./http";
import {
  appendCollectionPage,
  collectionComplete,
  finishCollection,
  nextCollectionPath,
} from "./collection";

export type SyncResult = {
  status: "updated" | "collecting" | "skipped" | "failed";
  message: string;
  nextAllowedAt: number;
  progress?: { roster: number; rosterTotal: number; furnace: number; furnaceTotal: number };
};

export async function syncWosguru(
  db: typeof portalDb,
  options: {
    fetcher?: typeof fetch;
    now?: () => number;
    paceMs?: number;
    maxRequests?: number;
    budgetMs?: number;
    resumeOnly?: boolean;
  } = {},
): Promise<SyncResult> {
  const now = options.now ?? Date.now;
  const started = now();
  const wallStarted = Date.now();
  const pace = options.paceMs ?? 1000;
  const token = crypto.randomUUID();
  if (options.resumeOnly) {
    const row = await db
      .select({ pending: sourceSync.pendingPayload })
      .from(sourceSync)
      .where(eq(sourceSync.id, SOURCE_ID))
      .get();
    if (!row?.pending)
      return { status: "skipped", message: "No collection needs resuming.", nextAllowedAt: 0 };
  }
  await db.insert(sourceSync).values({ id: SOURCE_ID }).onConflictDoNothing();
  const existing = await db.select().from(sourceSync).where(eq(sourceSync.id, SOURCE_ID)).get();
  const upgrading =
    existing?.status === "ready" &&
    !existing.pendingPayload &&
    decodeSnapshot(existing.payload)?.version === 1;
  // A one-time format upgrade can expand a successful old snapshot immediately.
  // Error/blocked cooldowns, including upstream Retry-After, are always respected.
  const [claimed] = await db
    .update(sourceSync)
    .set({ leaseToken: token, leaseExpiresAt: started + 120_000, lastAttemptAt: started })
    .where(
      and(
        eq(sourceSync.id, SOURCE_ID),
        lte(sourceSync.leaseExpiresAt, started),
        or(
          lte(sourceSync.nextAllowedAt, started),
          upgrading
            ? and(eq(sourceSync.status, "ready"), eq(sourceSync.payload, existing!.payload!))
            : sql`0`,
        ),
      ),
    )
    .returning();
  if (!claimed) {
    const row = await db.select().from(sourceSync).where(eq(sourceSync.id, SOURCE_ID)).get();
    return {
      status: "skipped",
      message: "A refresh is already running or the source is on cooldown.",
      nextAllowedAt: Math.max(row?.nextAllowedAt ?? 0, row?.leaseExpiresAt ?? 0),
    };
  }
  let job: SourceCollection | null = null;
  if (claimed.pendingPayload) {
    try {
      const parsed = collectionSchema.safeParse(JSON.parse(claimed.pendingPayload));
      if (
        parsed.success &&
        parsed.data.snapshot.version === 2 &&
        started - parsed.data.startedAt < 6 * HOUR
      )
        job = parsed.data;
    } catch {
      /* Invalid drafts are replaced; the published snapshot stays intact. */
    }
  }
  try {
    const fetcher = options.fetcher ?? fetch;
    const robots = await fetchText("https://wosguru.com/robots.txt", fetcher, now(), 64 * 1024);
    if (!/^\s*user-agent\s*:/im.test(robots) || /<html\b/i.test(robots))
      throw new SourceError(
        "Source robots rules are unavailable; collection was stopped",
        now() + HOUR,
      );
    if (!robotsAllowsState(robots))
      throw new SourceError("Source robots rules disallow this collection", now() + DAY, true);
    if (!job) {
      const snapshot = parseStatePage(
        await fetchText(SOURCE_URL, fetcher, now()),
        new Date(now()).toISOString(),
      );
      const previous = decodeSnapshot(claimed.payload);
      if (previous && Date.parse(snapshot.sourceUpdatedAt) < Date.parse(previous.sourceUpdatedAt))
        throw new SourceError(
          "Source returned older data; previous snapshot retained",
          now() + HOUR,
        );
      job = { snapshot, startedAt: now(), rosterPage: 2, furnaceBand: 0, furnacePage: 1 };
    }
    let requests = 0;
    let lastRequest = Date.now();
    // Reserve 20s for a final request timeout and time for checkpoint writes.
    while (
      !collectionComplete(job) &&
      requests < (options.maxRequests ?? 24) &&
      Date.now() - wallStarted < (options.budgetMs ?? 25_000)
    ) {
      const path = nextCollectionPath(job);
      if (!path) break;
      if (!robotsAllowsState(robots, path))
        throw new SourceError(
          "Source robots rules disallow the requested data endpoint",
          now() + DAY,
          true,
        );
      const wait = Math.max(0, pace - (Date.now() - lastRequest));
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      lastRequest = Date.now();
      const json = await fetchText(
        new URL(path, SOURCE_URL).href,
        fetcher,
        now(),
        1024 * 1024,
        "json",
      );
      appendCollectionPage(job, JSON.parse(json));
      requests++;
    }
    const finished = now();
    const complete = collectionComplete(job);
    const nextAllowedAt = finished + (complete ? HOUR : Math.max(pace, 1000));
    const [saved] = await db
      .update(sourceSync)
      .set({
        ...(complete
          ? { payload: JSON.stringify(finishCollection(job)), lastSuccessAt: finished }
          : {}),
        pendingPayload: complete ? null : JSON.stringify(job),
        status: complete ? "ready" : "collecting",
        nextAllowedAt,
        lastError: null,
        leaseToken: null,
        leaseExpiresAt: 0,
      })
      .where(and(eq(sourceSync.id, SOURCE_ID), eq(sourceSync.leaseToken, token)))
      .returning({ id: sourceSync.id });
    if (!saved)
      return {
        status: "skipped",
        message: "Refresh lease changed; no data was replaced.",
        nextAllowedAt,
      };
    return {
      status: complete ? "updated" : "collecting",
      message: complete
        ? "Complete state page and all player/furnace pages refreshed."
        : "Collecting the remaining pages; the previous snapshot remains available.",
      nextAllowedAt,
      progress: {
        roster: job.snapshot.players.length,
        rosterTotal: job.snapshot.coverage!.rosterTotal,
        furnace: job.snapshot.furnacePlayers.length,
        furnaceTotal: job.snapshot.coveredPlayers,
      },
    };
  } catch (error) {
    const nextAllowedAt =
      error instanceof SourceError ? Math.max(now() + 60_000, error.retryAt) : now() + HOUR;
    const message =
      error instanceof SourceError
        ? error.message
        : "Source could not be retrieved or its structure changed; previous data retained";
    await db
      .update(sourceSync)
      .set({
        pendingPayload: error instanceof SourceError && job ? JSON.stringify(job) : null,
        status: error instanceof SourceError && error.blocked ? "blocked" : "error",
        lastError: message,
        nextAllowedAt,
        leaseToken: null,
        leaseExpiresAt: 0,
      })
      .where(and(eq(sourceSync.id, SOURCE_ID), eq(sourceSync.leaseToken, token)));
    return { status: "failed", message, nextAllowedAt };
  }
}
