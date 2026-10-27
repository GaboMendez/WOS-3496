import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { createToken } from "@/lib/auth/token";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Find profile by email
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.email, email.trim().toLowerCase()),
    });

    if (!profile || !(await verifyPassword(password, profile.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Get user role
    const role = await db.query.userRoles.findFirst({
      where: (userRoles, { eq }) => eq(userRoles.userId, profile.id),
    });

    const userRole = role?.role || "viewer";

    // Create token
    const token = await createToken({
      userId: profile.id,
      email: profile.email || "",
      role: userRole,
    });

    const response = NextResponse.json({
      userId: profile.id,
      email: profile.email,
      role: userRole,
    });

    // Set cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
