import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/token";
import { db } from "../../../../db";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ userId: null, email: null, role: "viewer" });
    }

    const payload = await verifyToken(token);

    if (!payload || payload.userId === "guest") {
      return NextResponse.json({ userId: null, email: null, role: "viewer" });
    }

    // Get user profile
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, payload.userId),
    });

    if (!profile) {
      return NextResponse.json({ userId: null, email: null, role: "viewer" });
    }

    // Get user role
    const role = await db.query.userRoles.findFirst({
      where: (userRoles, { eq }) => eq(userRoles.userId, payload.userId),
    });

    const userRole = role?.role || "viewer";

    return NextResponse.json({
      userId: profile.id,
      email: profile.email,
      role: userRole,
    });
  } catch (error) {
    console.error("Auth status error:", error);
    return NextResponse.json({ userId: null, email: null, role: "viewer" });
  }
}
