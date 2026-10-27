import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { profiles, userRoles, appRoleEnum } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const rows = await db.select({ id: profiles.id, email: profiles.email, displayName: profiles.displayName, role: userRoles.role })
    .from(profiles).leftJoin(userRoles, eq(userRoles.userId, profiles.id));
  return NextResponse.json({ rows: rows.map((row) => ({ ...row, role: row.role || "viewer" })) });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const { id, role } = await request.json();
  if (typeof id !== "string" || !appRoleEnum.includes(role)) return NextResponse.json({ error: "Invalid role update" }, { status: 400 });
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, id) });
  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (id === user.id && role !== "admin") return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
  const existing = await db.query.userRoles.findFirst({ where: eq(userRoles.userId, id) });
  if (existing) await db.update(userRoles).set({ role }).where(eq(userRoles.userId, id));
  else await db.insert(userRoles).values({ id: crypto.randomUUID(), userId: id, role });
  return NextResponse.json({ ok: true });
}
