import { afterAll, expect, mock, test } from "bun:test";
import { migrate } from "drizzle-orm/libsql/migrator";
import { NextRequest } from "next/server";

// A separate test process ensures the application's DB module can only open
// this in-memory database, never DATABASE_URL from the developer environment.
process.env.DATABASE_URL = "file::memory:";
delete process.env.TURSO_AUTH_TOKEN;
mock.module("server-only", () => ({}));
mock.module("@/lib/auth", () => ({ getCurrentUser: async () => ({ isStaff: true, isAdmin: true }) }));

const { db } = await import("../db/index");
const { POST, PATCH, GET } = await import("../app/api/admin/[resource]/route");
await migrate(db, { migrationsFolder: "drizzle/sqlite" });
const context = { params: Promise.resolve({ resource: "alliances" }) };
const request = (method, data) => new NextRequest("http://localhost/api/admin/alliances", {
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

afterAll(() => mock.restore());

test("alliance admin CRUD validates, clears and uniquely constrains reviewed links", async () => {
  const created = await POST(request("POST", { name: "First", slug: "first", tag: "ABC", sourceAllianceTag: "ABC", power: 123 }), context);
  expect(created.status).toBe(201);
  const { row } = await created.json();
  expect((await POST(request("POST", { name: "Duplicate", slug: "second", tag: "DEF", sourceAllianceTag: "ABC" }), context)).status).toBe(400);
  for (const invalid of [" ABC", "ABC ", " ", "x".repeat(21), 42]) {
    expect((await PATCH(request("PATCH", { id: row.id, values: { sourceAllianceTag: invalid } }), context)).status).toBe(400);
  }
  expect((await PATCH(request("PATCH", { id: row.id, values: { sourceAllianceTag: "", name: "Edited", power: 456 } }), context)).status).toBe(200);
  const list = await GET(new NextRequest("http://localhost/api/admin/alliances"), context);
  expect((await list.json()).rows[0]).toMatchObject({ id: row.id, sourceAllianceTag: null, name: "Edited", power: 456 });
  expect((await POST(request("POST", { name: "Second", slug: "second", tag: "DEF", sourceAllianceTag: "ABC" }), context)).status).toBe(201);
});
