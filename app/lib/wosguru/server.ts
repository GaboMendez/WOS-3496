import "server-only";
import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { sourceSync } from "../../../db/schema";
import { SOURCE_ID, decodeSnapshot } from "./model";

export const getSourceData = cache(async () => {
  noStore();
  try {
    const row = await db
      .select({
        payload: sourceSync.payload,
        status: sourceSync.status,
        lastSuccessAt: sourceSync.lastSuccessAt,
        lastError: sourceSync.lastError,
        nextAllowedAt: sourceSync.nextAllowedAt,
      })
      .from(sourceSync)
      .where(eq(sourceSync.id, SOURCE_ID))
      .get();
    return {
      snapshot: decodeSnapshot(row?.payload ?? null),
      status: row?.status ?? "idle",
      lastSuccessAt: row?.lastSuccessAt ?? null,
      lastError: row?.lastError ?? null,
      nextAllowedAt: row?.nextAllowedAt ?? 0,
    };
  } catch (error) {
    // A deployment before its additive migration must still serve editorial data.
    if (
      /no such table[^\n]*source_sync/i.test(
        String(error instanceof Error ? error.message + " " + String(error.cause) : error),
      )
    ) {
      return {
        snapshot: null,
        status: "unavailable",
        lastSuccessAt: null,
        lastError: "Run the database migration to enable state data refresh.",
        nextAllowedAt: 0,
      };
    }
    throw error;
  }
});
