import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Create SQLite client using libsql (works with Next.js)
const client = createClient({
  url: process.env.DATABASE_URL || "file:data/portal.db",
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Export schema for type-safe queries
export { schema };
