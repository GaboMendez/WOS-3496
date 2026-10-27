import { NextRequest, NextResponse } from "next/server";
import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../../../../db";
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
      output[key] = value;
    }
  }
  if ("updatedAt" in columns) output.updatedAt = new Date().toISOString();
  return output;
}

export async function POST(request: NextRequest, context: Context) {
  const result = await authorize(context);
  if (result.error) return result.error;
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
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !body.id) throw new Error("Record ID required");
    const table = result.resource!.table;
    const data = prepareInput(body.values, table);
    if (!Object.keys(data).length) throw new Error("No changes supplied");
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
    await db.delete(table).where(eq(getTableColumns(table).id, body.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete record" }, { status: 400 });
  }
}
