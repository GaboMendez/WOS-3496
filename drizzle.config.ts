import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./drizzle/sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:data/portal.db",
  },
});
