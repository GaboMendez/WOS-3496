import { test, expect, beforeEach, afterEach } from "bun:test";
import { readFile } from "node:fs/promises";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../db/schema.ts";
import { SOURCE_ID, decodeSnapshot } from "../app/lib/wosguru/model.ts";
import { parseAmount, parseStatePage } from "../app/lib/wosguru/parser.ts";
import {
  DAY,
  HOUR,
  SourceError,
  fetchText,
  retryAt,
  robotsAllowsState,
} from "../app/lib/wosguru/http.ts";
import { syncWosguru as syncCore } from "../app/lib/wosguru/sync.ts";
import { appendCollectionPage, finishCollection } from "../app/lib/wosguru/collection.ts";
const syncWosguru = (db, options = {}) => syncCore(db, { paceMs: 0, ...options });

// Authored fixture: no captured roster or third-party document is committed.
const fixture = `<!doctype html><html><head><link rel="canonical" href="https://wosguru.com/state/3496"></head><body>
<h1 class="sp-title">State 3496</h1><time class="sp-rate-upd" datetime="2026-10-29T16:36:58.488Z"></time>
<div class="sp-rate-num">1,550</div><div class="sp-split-row"><b>1,560</b><b>1,540</b></div>
<div class="sp-metaline">Gen 6 heroes · Fire Crystal 8</div>
<div class="sp-ranks"><div class="sp-rk"><b>#600</b><span>SvS rating <i>of 4,000</i></span></div><div class="sp-rk"><b>#40</b><span>Transfer group 14 <i>of 384</i></span></div></div>
<div class="sp-power"><div><b>45.5B</b><span>Top-100 power</span></div><div><b>5.1B</b><span>Top-100 kills</span></div></div>
<p class="sp-power-note">Each rank is as of 3 Nov.</p>
<section id="alliances"><table><tbody><tr><td>1</td><td class="nm"><a>[TST]</a><span class="an">Test alliance</span></td><td></td><td>30.5B</td><td>95</td><td class="c-fc"><span class="fc"><img alt="FC7">FC7</span></td></tr></tbody></table></section>
<div id="roster-list"><div class="sp-prow"><span class="rk">#1</span><span class="who"><b><a href="/player/12345">Test &amp; Player</a></b><span class="meta"><a class="sp-al">TST</a><span class="fcn">FC8</span></span></span><span class="vl">900M</span></div></div>
<section id="furnace"><script class="fcc-data" type="application/json">{"bands":{"fc8":{"levels":[[70,5]]},"fc7":{"levels":[[65,4],[66,3]]}}}</script></section>
<section id="svs"><div class="sp-cyc" id="c-2026-10-10"><span class="vs"><span class="sp-side def">Defense</span><a href="/state/3400">State 3400</a></span><span class="sp-pill l">Defense failed</span></div></section>
<section id="coming"><ol class="sp-cal"><li><span class="when"><small>7 Nov</small></span><span class="what">SvS castle battle</span></li></ol></section>
</body></html>`;
const START = Date.parse("2026-11-03T08:00:00Z");
let client;
let db;

beforeEach(async () => {
  client = createClient({ url: "file::memory:" });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "drizzle/sqlite" });
});
afterEach(() => client.close());

const htmlResponse = (body) =>
  new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
const plainResponse = (body) => new Response(body, { headers: { "content-type": "text/plain" } });
const happyFetch = async (url) => {
  if (url.endsWith("robots.txt")) return plainResponse("User-agent: *\nAllow: /\n");
  if (url.includes("/furnace?")) {
    const band = new URL(url).searchParams.get("band");
    const rows =
      band === "fc8"
        ? [
            ["Test & Player", "TST", 70, 900000001, "/player/12345"],
            ...Array.from({ length: 4 }, () => [null, null, 70, 100, null]),
          ]
        : [
            ...Array.from({ length: 4 }, () => [null, null, 65, 100, null]),
            ...Array.from({ length: 3 }, () => [null, null, 66, 100, null]),
          ];
    return Response.json({ total: rows.length, page: 1, per: 50, pages: 1, rows });
  }
  return htmlResponse(fixture);
};
const stored = () => db.select().from(schema.sourceSync).get();

test("parses ratings, partial coverage, rounded values, stable IDs and decoded names", () => {
  const snapshot = parseStatePage(fixture, new Date(START).toISOString());
  expect(snapshot.state.top100Power).toBe(45_500_000_000);
  expect(snapshot.state.top100Labyrinth).toBeNull();
  expect(snapshot.coveredPlayers).toBe(12);
  expect(snapshot.players[0]).toMatchObject({
    chiefId: "12345",
    name: "Test & Player",
    power: 900_000_000,
  });
  expect(snapshot.alliances[0].medianFurnace).toBe("FC7");
  expect(snapshot.svs[0]).toMatchObject({ date: "2026-10-10", side: "defense", result: "loss" });
  expect(snapshot.upcoming[0]).toEqual({
    dateLabel: "7 Nov",
    title: "SvS castle battle",
    relativeLabel: "",
  });
  expect(parseAmount("1,250")).toBe(1250);
  expect(() => parseAmount("unknown")).toThrow();
});

test("rejects challenges, wrong states, missing essential fields and invalid stored data", () => {
  for (const html of [
    "Please solve this CAPTCHA",
    fixture.replace(/state\/3496/g, "state/3497"),
    fixture.replace("Top-100 power", "Changed label"),
    fixture.replace('href="/player/12345"', 'href="https://example.com/player/12345"'),
  ]) {
    expect(() => parseStatePage(html, new Date(START).toISOString())).toThrow();
  }
  expect(decodeSnapshot("not JSON")).toBeNull();
  expect(decodeSnapshot('{"stateNumber":3496}')).toBeNull();
});

test("honors named robots groups, longest paths, wildcard rules and allow ties", () => {
  expect(robotsAllowsState("User-agent: *\nAllow: /\nDisallow: /state/*/vs")).toBe(true);
  expect(
    robotsAllowsState("User-agent: *\nAllow: /\nUser-agent: WOS3496Portal\nDisallow: /state/"),
  ).toBe(false);
  expect(robotsAllowsState("User-agent: *\nDisallow: /state/\nAllow: /state/3496$")).toBe(true);
  expect(robotsAllowsState("User-agent: *\nAllow: /state/3496\nDisallow: /state/3496")).toBe(true);
  expect(robotsAllowsState("User-agent: OtherBot\nDisallow: /\nUser-agent: *\nAllow: /")).toBe(
    true,
  );
});

test("honors numeric and HTTP-date Retry-After without shortening long cooldowns", () => {
  expect(retryAt("120", START)).toBe(START + 120_000);
  expect(retryAt(new Date(START + 600_000).toUTCString(), START)).toBe(START + 600_000);
  expect(retryAt("broken", START)).toBe(START + HOUR);
  expect(retryAt("172800", START)).toBe(START + 2 * DAY);
  expect(retryAt("999999999", START)).toBe(START + 999999999000);
});

test("limits response size and rejects unexpected content without executing scripts", async () => {
  await expect(
    fetchText("https://wosguru.com/state/3496", async () => plainResponse("12345"), START, 4),
  ).rejects.toBeInstanceOf(SourceError);
  await expect(
    fetchText(
      "https://wosguru.com/state/3496",
      async () => new Response("{}", { headers: { "content-type": "application/json" } }),
      START,
    ),
  ).rejects.toBeInstanceOf(SourceError);
  await fetchText(
    "https://wosguru.com/state/3496",
    async (_url, options) => {
      expect(options.redirect).toBe("error");
      expect(options.credentials).toBe("omit");
      expect(options.headers["User-Agent"]).toStartWith("WOS3496Portal/");
      return htmlResponse(fixture);
    },
    START,
  );
});

test("persists a snapshot without changing staff settings and skips requests on cooldown", async () => {
  await db.insert(schema.stateSettings).values({
    id: "state-3496",
    stateNumber: 3496,
    displayName: "Our custom state",
    top100Power: 123,
    recruitingStatus: "open",
  });
  const result = await syncWosguru(db, { fetcher: happyFetch, now: () => START });
  expect(result.status).toBe("updated");
  expect(decodeSnapshot((await stored()).payload).players[0].chiefId).toBe("12345");
  expect(await db.select().from(schema.stateSettings).get()).toMatchObject({
    displayName: "Our custom state",
    top100Power: 123,
    recruitingStatus: "open",
  });
  let requests = 0;
  expect(
    (
      await syncWosguru(db, {
        fetcher: async () => {
          requests++;
          throw new Error("Must not fetch");
        },
        now: () => START + 1000,
      })
    ).status,
  ).toBe("skipped");
  expect(requests).toBe(0);
});

test("429 preserves last-good data and persists the requested cooldown", async () => {
  await syncWosguru(db, { fetcher: happyFetch, now: () => START });
  const previous = await stored();
  const attemptedAt = START + HOUR + 1;
  const response = await syncWosguru(db, {
    now: () => attemptedAt,
    fetcher: async () => new Response("busy", { status: 429, headers: { "Retry-After": "7200" } }),
  });
  expect(response.status).toBe("failed");
  const row = await stored();
  expect(row.payload).toBe(previous.payload);
  expect(row.lastSuccessAt).toBe(previous.lastSuccessAt);
  expect(row.nextAllowedAt).toBe(attemptedAt + 2 * HOUR);
  expect(row.leaseToken).toBeNull();
});

test("robots denial makes no state request; 403 stops collection", async () => {
  const urls = [];
  const result = await syncWosguru(db, {
    now: () => START,
    fetcher: async (url) => {
      urls.push(url);
      return plainResponse("User-agent: *\nDisallow: /state/");
    },
  });
  expect(result.status).toBe("failed");
  expect(urls).toEqual(["https://wosguru.com/robots.txt"]);
  expect((await stored()).status).toBe("blocked");
  await db.delete(schema.sourceSync);
  await syncWosguru(db, {
    now: () => START,
    fetcher: async () => new Response("Forbidden", { status: 403 }),
  });
  expect((await stored()).nextAllowedAt).toBe(START + DAY);
});

test("malformed or older source pages do not erase the last good snapshot", async () => {
  await syncWosguru(db, { fetcher: happyFetch, now: () => START });
  const previous = await stored();
  for (const [index, html] of [
    "<h1>Verify you are human</h1>",
    fixture.replace("2026-10-29T16:36:58.488Z", "2026-10-20T16:36:58.488Z"),
  ].entries()) {
    const result = await syncWosguru(db, {
      now: () => START + (index + 2) * HOUR,
      fetcher: async (url) =>
        url.endsWith("robots.txt") ? plainResponse("User-agent: *\nAllow: /") : htmlResponse(html),
    });
    expect(result.status).toBe("failed");
    expect((await stored()).payload).toBe(previous.payload);
  }
});

test("an active database lease prevents another invocation from fetching", async () => {
  await db
    .insert(schema.sourceSync)
    .values({ id: SOURCE_ID, leaseToken: "other-run", leaseExpiresAt: START + 60_000 });
  let requests = 0;
  const result = await syncWosguru(db, {
    now: () => START,
    fetcher: async () => {
      requests++;
      throw new Error("Must not fetch");
    },
  });
  expect(result.status).toBe("skipped");
  expect(requests).toBe(0);
  expect((await stored()).leaseToken).toBe("other-run");
});

test("an HTML challenge at robots.txt stops collection before requesting the state page", async () => {
  const urls = [];
  const result = await syncWosguru(db, {
    now: () => START,
    fetcher: async (url) => {
      urls.push(url);
      return htmlResponse("<html><h1>Verify you are human</h1></html>");
    },
  });
  expect(result.status).toBe("failed");
  expect(urls).toEqual(["https://wosguru.com/robots.txt"]);
  expect((await stored()).payload).toBeNull();
});

test("the migration is additive and does not include editorial record updates", async () => {
  const sql = await readFile("drizzle/sqlite/0004_right_invaders.sql", "utf8");
  expect(sql).toContain("CREATE TABLE `source_sync`");
  expect(sql).not.toMatch(/\b(?:DROP|DELETE|UPDATE|ALTER)\b/i);
});

test("checkpoints incomplete collections and publishes only after every band is complete", async () => {
  const first = await syncWosguru(db, { fetcher: happyFetch, now: () => START, maxRequests: 1 });
  expect(first.status).toBe("collecting");
  expect((await stored()).payload).toBeNull();
  expect((await stored()).pendingPayload).not.toBeNull();
  const urls = [];
  const second = await syncWosguru(db, {
    now: () => START + 1001,
    fetcher: async (url) => {
      urls.push(url);
      return happyFetch(url);
    },
  });
  expect(second.status).toBe("updated");
  expect(urls).toHaveLength(2);
  expect(urls[1]).toContain("band=fc7");
  const saved = decodeSnapshot((await stored()).payload);
  expect(saved.coverage).toMatchObject({ rosterComplete: true, furnaceComplete: true });
  expect(saved.furnacePlayers).toHaveLength(12);
  expect(saved.players[0].exactPower).toBe(900000001);
  expect((await stored()).pendingPayload).toBeNull();
});

test("rate limits retain pagination progress and forbid early resumption", async () => {
  await syncWosguru(db, { fetcher: happyFetch, now: () => START, maxRequests: 1 });
  const pending = (await stored()).pendingPayload;
  const result = await syncWosguru(db, {
    now: () => START + 1001,
    fetcher: async (url) =>
      url.endsWith("robots.txt")
        ? happyFetch(url)
        : new Response("busy", { status: 429, headers: { "retry-after": "120" } }),
  });
  expect(result.status).toBe("failed");
  expect((await stored()).pendingPayload).toBe(pending);
  expect((await stored()).nextAllowedAt).toBe(START + 121001);
  const early = await syncWosguru(db, {
    now: () => START + 2000,
    fetcher: () => {
      throw new Error("Must not request during cooldown");
    },
  });
  expect(early.status).toBe("skipped");
});

test("validates roster page identity, total and rank continuity", () => {
  const snapshot = parseStatePage(fixture, new Date(START).toISOString());
  snapshot.players = Array.from({ length: 50 }, (_, index) => ({
    ...snapshot.players[0],
    rank: index + 1,
    chiefId: String(index + 1),
  }));
  snapshot.coverage = {
    rosterTotal: 51,
    rosterPages: 2,
    rosterComplete: false,
    furnaceComplete: false,
  };
  const job = { snapshot, startedAt: START, rosterPage: 2, furnaceBand: 0, furnacePage: 1 };
  const lastRow =
    '<div class="sp-prow"><span class="rk">#51</span><span class="who"><b><a href="/player/999">Last player</a></b><span class="fcn">FC8</span></span><span class="vl">10M</span></div>';
  const page = { total: 51, page: 2, per: 50, pages: 2, html: lastRow };
  expect(() => appendCollectionPage(job, { ...page, total: 52 })).toThrow();
  expect(() =>
    appendCollectionPage(job, { ...page, html: lastRow.replace("#51", "#1") }),
  ).toThrow();
  appendCollectionPage(job, page);
  expect(job.snapshot.players).toHaveLength(51);
  expect(job.snapshot.coverage.rosterComplete).toBe(true);
  expect(() => finishCollection(job)).toThrow();
});

test("a resume-only cron is a no-op without a pending collection", async () => {
  const result = await syncWosguru(db, {
    resumeOnly: true,
    fetcher: () => {
      throw new Error("Must not fetch");
    },
  });
  expect(result.status).toBe("skipped");
});

test("older snapshots remain readable after extending the import", () => {
  const snapshot = parseStatePage(fixture, new Date(START).toISOString());
  snapshot.version = 1;
  delete snapshot.sections;
  delete snapshot.coverage;
  delete snapshot.furnacePlayers;
  delete snapshot.sourceLinks;
  const saved = decodeSnapshot(JSON.stringify(snapshot));
  expect(saved.version).toBe(1);
  expect(saved.sections).toEqual([]);
  expect(saved.players).toHaveLength(1);
});

test("a format upgrade expands a successful old snapshot but never ignores an error cooldown", async () => {
  const legacy = parseStatePage(fixture, new Date(START).toISOString());
  legacy.version = 1;
  await db.insert(schema.sourceSync).values({
    id: SOURCE_ID,
    payload: JSON.stringify(legacy),
    status: "ready",
    nextAllowedAt: START + HOUR,
  });
  const upgraded = await syncWosguru(db, { now: () => START, fetcher: happyFetch });
  expect(upgraded.status).toBe("updated");
  expect(decodeSnapshot((await stored()).payload).version).toBe(2);
  await db.delete(schema.sourceSync);
  await db.insert(schema.sourceSync).values({
    id: SOURCE_ID,
    payload: JSON.stringify(legacy),
    status: "error",
    nextAllowedAt: START + HOUR,
  });
  const blocked = await syncWosguru(db, {
    now: () => START,
    fetcher: () => {
      throw new Error("Must not fetch");
    },
  });
  expect(blocked.status).toBe("skipped");
});

test("extracts castle history, movements, other leaderboards and furnace summary", () => {
  const extra = `<section id="castle"><div class="sp-hold"><span class="d">10 Oct<small>2026</small></span><span class="who"><b>[ABC]</b> Test President</span><span class="what">President <span class="sp-tag">SvS</span></span></div></section>
    <section id="moves"><h2><span class="hint">Since 1 Oct 2026</span></h2><div class="sp-mini"><h3>Moved in 1</h3><div class="sp-prow" title="2 Oct to 3 Oct"><span class="who"><b>Transfer Player</b><span class="meta"><a class="sp-al">ABC</a><span class="fcn">FC7</span></span></span><span class="vl"><a>State 3200</a><span class="sp-mv-pw">100M</span></span></div></div></section>
    <section id="players"><div class="sp-mini"><h3>Kills</h3><div class="sp-prow"><span class="rk">#1</span><span class="who"><b>Test Chief</b></span><span class="vl">1.2M</span></div></div></section>`;
  const html = fixture
    .replace("</body>", extra + "</body>")
    .replace('<img alt="FC7">FC7', '<span class="wos-fc-lv">26</span>26');
  const data = parseStatePage(html, new Date(START).toISOString());
  expect(data.alliances[0].medianFurnace).toBe("26");
  expect(data.sections.find((item) => item.id === "castle").tables[0].rows[0]).toEqual([
    "10 Oct 2026",
    "[ABC]",
    "Test President",
    "President",
    "Yes",
  ]);
  expect(data.sections.find((item) => item.id === "moves").tables[0].rows[0]).toEqual([
    "Transfer Player",
    "ABC",
    "FC7",
    "State 3200",
    "100M",
    "2 Oct to 3 Oct",
  ]);
  expect(data.sections.find((item) => item.id === "player-leaderboards").tables[0].rows[0][5]).toBe(
    "1.2M",
  );
});
