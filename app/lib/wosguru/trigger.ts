import "server-only";
import { NextResponse } from "next/server";
import { db } from "../../../db";
import { syncWosguru } from "./sync";

export async function triggerRefresh(resumeOnly = false) {
  if (process.env.WOSGURU_SYNC_ENABLED === "false") {
    return NextResponse.json(
      { error: "State data refresh is disabled." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const result = await syncWosguru(db, { resumeOnly });
    return NextResponse.json(result, {
      status: result.status === "failed" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Refresh storage is unavailable. Check the database migration and server logs." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
