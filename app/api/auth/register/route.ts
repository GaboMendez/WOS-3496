import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { profiles, userRoles } from "../../../../db/schema";
import { createToken } from "@/lib/auth/token";
import { hashPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (typeof email !== "string" || typeof password !== "string" || typeof displayName !== "string" || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !displayName.trim()) {
      return NextResponse.json(
        { error: "Valid email, display name, and a password of at least 8 characters are required" },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existing = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.email, email.trim().toLowerCase()),
    });

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Create new profile
    const userId = crypto.randomUUID();
    await db.insert(profiles).values({
      id: userId,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      passwordHash: await hashPassword(password),
    });

    // Default role is viewer
    await db.insert(userRoles).values({
      id: crypto.randomUUID(),
      userId,
      role: "viewer",
    });

    // Create token
    const token = await createToken({
      userId,
      email: email.trim().toLowerCase(),
      role: "viewer",
    });

    const response = NextResponse.json({
      userId,
      email,
      role: "viewer",
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
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
