import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSourceData } from "@/lib/wosguru/server";
import { triggerRefresh } from "@/lib/wosguru/trigger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await getCurrentUser())?.isAdmin)
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const { snapshot, ...status } = await getSourceData();
  return NextResponse.json(
    {
      ...status,
      sourceUpdatedAt: snapshot?.sourceUpdatedAt ?? null,
      players: snapshot?.players.length ?? 0,
      alliances: snapshot?.alliances.length ?? 0,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await getCurrentUser())?.isAdmin)
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  return triggerRefresh();
}
