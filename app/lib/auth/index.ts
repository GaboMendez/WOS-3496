import { getAuthToken, setAuthToken, removeAuthToken } from "./cookies";
import { createToken, verifyToken } from "./token";
import { db } from "../../../db";
import { profiles, userRoles, type AppRole } from "../../../db/schema";
import { hashPassword, verifyPassword } from "./password";

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  role: AppRole;
  isAdmin: boolean;
  isEditor: boolean;
  isStaff: boolean;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload || payload.userId === "guest") {
    return null;
  }

  // Get user profile
  const profile = await db.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.id, payload.userId),
  });

  if (!profile) {
    return null;
  }

  // Get user role
  const role = await db.query.userRoles.findFirst({
    where: (userRoles, { eq }) => eq(userRoles.userId, payload.userId),
  });

  const userRole = role?.role || "viewer";

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    role: userRole,
    isAdmin: userRole === "admin",
    isEditor: userRole === "editor" || userRole === "admin",
    isStaff: userRole === "admin" || userRole === "editor",
  };
}

export async function login(email: string, password: string): Promise<AuthUser | null> {
  // Find profile by email
  const profile = await db.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.email, email.trim().toLowerCase()),
  });

  if (!profile || !(await verifyPassword(password, profile.passwordHash))) {
    return null;
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

  await setAuthToken(token);

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    role: userRole,
    isAdmin: userRole === "admin",
    isEditor: userRole === "editor" || userRole === "admin",
    isStaff: userRole === "admin" || userRole === "editor",
  };
}

export async function logout(): Promise<void> {
  await removeAuthToken();
}

export async function register(
  email: string,
  displayName: string,
  password: string,
): Promise<AuthUser | null> {
  // Check if profile already exists
  const existing = await db.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.email, email.trim().toLowerCase()),
  });

  if (existing) {
    return null;
  }

  // Create new profile
  const userId = crypto.randomUUID();
  await db.insert(profiles).values({
    id: userId,
    email: email.trim().toLowerCase(),
    displayName,
    passwordHash: await hashPassword(password),
  });

  // Default role is viewer
  await db.insert(userRoles).values({
    id: crypto.randomUUID(),
    userId,
    role: "viewer",
  });

  const token = await createToken({
    userId,
    email,
    role: "viewer",
  });

  await setAuthToken(token);

  return {
    id: userId,
    email,
    displayName,
    role: "viewer",
    isAdmin: false,
    isEditor: false,
    isStaff: false,
  };
}

// Helper to check if user has required role
export function hasRole(user: AuthUser | null, requiredRole: AppRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<AppRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}
