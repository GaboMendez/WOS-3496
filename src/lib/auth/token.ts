import { SignJWT, jwtVerify } from "jose";
import type { AppRole } from "../../../db/schema";

const configuredSecret = process.env.JWT_SECRET;
if (!configuredSecret || configuredSecret.startsWith("your-")) {
  throw new Error("Set a strong JWT_SECRET in .env.local or the deployment environment.");
}
const SECRET_KEY = new TextEncoder().encode(configuredSecret);

export interface TokenPayload {
  userId: string;
  email: string;
  role: AppRole;
  exp?: number;
}

export async function createToken(payload: Omit<TokenPayload, "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (!payload || typeof payload.userId !== "string") {
      return null;
    }
    return {
      userId: payload.userId,
      email: typeof payload.email === "string" ? payload.email : "",
      role:
        typeof payload.role === "string" && ["admin", "editor", "viewer"].includes(payload.role)
          ? (payload.role as AppRole)
          : "viewer",
    };
  } catch {
    return null;
  }
}

export async function createGuestToken(): Promise<string> {
  return new SignJWT({ userId: "guest", email: "", role: "viewer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}
