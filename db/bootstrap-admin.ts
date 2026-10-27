import { input, password } from "@inquirer/prompts";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { profiles, userRoles } from "./schema";
import { hashPassword } from "../src/lib/auth/password";

const email = (await input({ message: "Admin email:" })).trim().toLowerCase();
if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
const displayName = (await input({ message: "Display name:" })).trim();
if (!displayName) throw new Error("Display name is required.");
const secret = await password({ message: "New password (at least 8 characters):", mask: "*" });
if (secret.length < 8) throw new Error("Password must be at least 8 characters.");

const existing = await db.query.profiles.findFirst({ where: eq(profiles.email, email) });
const userId = existing?.id || crypto.randomUUID();
const passwordHash = await hashPassword(secret);
if (existing) await db.update(profiles).set({ displayName, passwordHash }).where(eq(profiles.id, userId));
else await db.insert(profiles).values({ id: userId, email, displayName, passwordHash });

const role = await db.query.userRoles.findFirst({ where: eq(userRoles.userId, userId) });
if (role) await db.update(userRoles).set({ role: "admin" }).where(eq(userRoles.userId, userId));
else await db.insert(userRoles).values({ id: crypto.randomUUID(), userId, role: "admin" });
console.log(`Admin account ready: ${email}`);
