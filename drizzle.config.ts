import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL || "file:data/portal.db";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle/sqlite",
  ...(url.startsWith("file:")
    ? { dialect: "sqlite", dbCredentials: { url } }
    : {
        dialect: "turso",
        dbCredentials: { url, authToken: process.env.TURSO_AUTH_TOKEN },
      }),
});
