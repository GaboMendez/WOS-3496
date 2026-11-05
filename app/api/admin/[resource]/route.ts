import { NextRequest, NextResponse } from "next/server";
import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../../../../db";
import { alliances, players, sourceSuppressions, svsCycles } from "../../../../db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getResource } from "@/lib/admin/resources";

type Context = { params: Promise<{ resource: string }> };

async function authorize(context: Context) {
  const user = await getCurrentUser();
  const { resource: name } = await context.params;
  const resource = getResource(name);
  if (!resource) return { error: NextResponse.json({ error: "Unknown resource" }, { status: 404 }) };
  if (!user?.isStaff || (resource.adminOnly && !user.isAdmin)) return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  return { resource };
}

export async function GET(_request: NextRequest, context: Context) {
  const result = await authorize(context);
  if (result.error) return result.error;
  try {
    const rows = await db.select().from(result.resource!.table);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Admin list error:", error);
    return NextResponse.json({ error: "Could not load records" }, { status: 500 });
  }
}

function prepareInput(input: unknown, table: NonNullable<ReturnType<typeof getResource>>["table"], creating = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid record");
  const columns = getTableColumns(table);
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (["id", "createdAt", "updatedAt"].includes(key)) continue;
    const column = columns[key];
    if (!column) throw new Error(`Unknown field: ${key}`);
    if (key.startsWith("source") && key !== "sourceUrl" && !(key === "sourceAllianceTag" && table === alliances)) throw new Error(`${key} is managed by synchronization`);
    if (value === "" || value === null) {
      if (column.notNull && creating && column.hasDefault) continue;
      if (column.notNull) throw new Error(`${key} is required`);
      output[key] = null;
    } else if (column.dataType === "boolean") {
      if (typeof value !== "boolean") throw new Error(`${key} must be true or false`);
      output[key] = value;
    } else if (column.dataType === "number") {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`${key} must be a number`);
      output[key] = number;
    } else if (key === "states") {
      const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
      if (!Array.isArray(parsed) || !parsed.every((item) => Number.isInteger(item) && item > 0)) throw new Error("states must be an array of state numbers");
      output[key] = JSON.stringify(parsed);
    } else if (key === "socialLinks") {
      const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
      if (!Array.isArray(parsed)) throw new Error("socialLinks must be a JSON array");
      output[key] = JSON.stringify(parsed);
    } else {
      if (typeof value !== "string") throw new Error(`${key} must be text`);
      if (key === "sourceAllianceTag" && (value !== value.trim() || value.length > 20 || !value.trim())) {
        throw new Error("Source alliance tag must be 1–20 characters with no surrounding whitespace");
      }
      output[key] = value;
    }
  }
  if ("updatedAt" in columns) output.updatedAt = new Date().toISOString();
  return output;
}

export async function POST(request: NextRequest, context: Context) {
  const result = await authorize(context);
  if (result.error) return result.error;
  if (result.resource!.table === sourceSuppressions) return NextResponse.json({ error: "Suppressions can only be removed" }, { status: 403 });
  try {
    const table = result.resource!.table;
    const data = prepareInput(await request.json(), table, true);
    const row = { ...data, id: crypto.randomUUID() };
    await db.insert(table).values(row);
    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create record" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  const result = await authorize(context);
  if (result.error) return result.error;
  if (result.resource!.table === sourceSuppressions) return NextResponse.json({ error: "Suppressions can only be removed" }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !body.id) throw new Error("Record ID required");
    const table = result.resource!.table;
    const data = prepareInput(body.values, table);
    if (!Object.keys(data).length) throw new Error("No changes supplied");
    if (table === alliances && Object.hasOwn(data, "sourceAllianceTag")) {
      const previous = await db.select({ tag: alliances.sourceAllianceTag }).from(alliances).where(eq(alliances.id, body.id)).get();
      // Changing or clearing the confirmed link is an explicit new identity review.
      if (previous && previous.tag !== data.sourceAllianceTag) Object.assign(data, {
        sourceName: null, sourceRank: null, sourcePower: null, sourceMembers: null,
        sourceMedianFurnace: null, sourceCastleWins: null, sourceObservedAt: null,
      });
    }
    await db.update(table).set(data).where(eq(getTableColumns(table).id, body.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update record" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const result = await authorize(context);
  if (result.error) return result.error;
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !body.id) throw new Error("Record ID required");
    const table = result.resource!.table;
    if (result.resource!.label === "State settings") throw new Error("State settings cannot be deleted");
    await db.transaction(async (tx) => {
      let suppression: { entityKind: "alliance" | "player" | "svs"; sourceKey: string } | null = null;
      if (table === alliances) {
        const row = await tx.select().from(alliances).where(eq(alliances.id, body.id)).get();
        if (row?.sourceAllianceTag && (row.sourceManaged || row.sourceObservedAt)) {
          suppression = { entityKind: "alliance", sourceKey: row.sourceAllianceTag };
          // Only observed relationships are cleared; administrator assignments remain protected.
          const staffPlayer = await tx.select({ id: players.id }).from(players).where(eq(players.allianceId, body.id)).limit(1);
          if (staffPlayer.length) throw new Error("This alliance has administrator-assigned players; reassign them before deleting it");
          await tx.update(players).set({ sourceAllianceId: null }).where(eq(players.sourceAllianceId, body.id));
        }
      } else if (table === players) {
        const row = await tx.select().from(players).where(eq(players.id, body.id)).get();
        if (row?.chiefId && (row.sourceManaged || row.sourceObservedAt)) suppression = { entityKind: "player", sourceKey: row.chiefId };
      } else if (table === svsCycles) {
        const row = await tx.select().from(svsCycles).where(eq(svsCycles.id, body.id)).get();
        if (row?.sourceManaged) suppression = { entityKind: "svs", sourceKey: row.id };
      }
      await tx.delete(table).where(eq(getTableColumns(table).id, body.id));
      if (suppression) await tx.insert(sourceSuppressions).values({ id: crypto.randomUUID(), ...suppression }).onConflictDoNothing();
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete record" }, { status: 400 });
  }
}
