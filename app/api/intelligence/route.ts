import { NextRequest, NextResponse } from "next/server";
import { getSourceData } from "@/lib/wosguru/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { snapshot } = await getSourceData();
  if (!snapshot)
    return NextResponse.json({ error: "No state snapshot is available yet." }, { status: 404 });
  const download = request.nextUrl.searchParams.get("download") === "1";
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      ...(download
        ? { "Content-Disposition": 'attachment; filename="state-3496-intelligence.json"' }
        : {}),
    },
  });
}
