import { load } from "cheerio/slim";
import {
  PARSER_VERSION,
  SOURCE_URL,
  playerSchema,
  snapshotSchema,
  type WosguruSnapshot,
} from "./model";
import { parseSourceSections } from "./sections";

export function parseAmount(value: string): number {
  const match = /^(\d+(?:\.\d+)?)([KMBT])?$/i.exec(value.replace(/,/g, "").trim());
  if (!match) throw new Error("Missing or invalid source number");
  const multiplier = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[match[2]?.toUpperCase() ?? ""] ?? 1;
  const result = Math.round(Number(match[1]) * multiplier);
  if (!Number.isSafeInteger(result)) throw new Error("Source number exceeds supported precision");
  return result;
}

export function parseRosterRows(html: string) {
  const $ = load(html);
  return $(".sp-prow")
    .map((_, element) => {
      const row = $(element);
      const path = row.find(".who b a").attr("href");
      if (path && !/^\/player\/\d{1,20}$/.test(path))
        throw new Error("Unexpected chief identity path");
      return playerSchema.parse({
        rank: parseAmount(row.children(".rk").text().replace(/^#/, "")),
        chiefId: path?.split("/").pop() ?? null,
        name: row.find(".who b").text().trim() || "Not named",
        allianceTag: row.find(".meta .sp-al").text().trim() || null,
        furnaceLevel: row.find(".fcn").text().trim(),
        power: parseAmount(row.children(".vl").text()),
      });
    })
    .get();
}

export function parseStatePage(
  html: string,
  fetchedAt = new Date().toISOString(),
): WosguruSnapshot {
  const $ = load(html);
  if (
    $('link[rel="canonical"]').attr("href") !== SOURCE_URL ||
    !/^State\s+3496$/.test($("h1.sp-title").text().trim())
  ) {
    throw new Error("Expected the public State 3496 page");
  }
  const sourceTime = $(".sp-rate-upd[datetime]").attr("datetime");
  if (!sourceTime || !Number.isFinite(Date.parse(sourceTime)))
    throw new Error("Source update time is missing");
  const sourceUpdatedAt = new Date(sourceTime).toISOString();
  if (Date.parse(sourceUpdatedAt) > Date.parse(fetchedAt) + 86_400_000)
    throw new Error("Source update time is in the future");

  const facts = new Map<string, number>();
  $(".sp-power > div").each((_, element) => {
    const item = $(element);
    facts.set(
      item.children("span").first().text().trim().toLowerCase(),
      parseAmount(item.children("b").first().text()),
    );
  });
  const ranks = $(".sp-ranks .sp-rk");
  const global = ranks
    .filter((_, element) => $(element).children("span").text().startsWith("SvS rating"))
    .first();
  const group = ranks
    .filter((_, element) => $(element).children("span").text().startsWith("Transfer group"))
    .first();
  const metaline = $(".sp-metaline").text();
  const numberFrom = (text: string) => parseAmount(text.replace(/^(?:#|of\s+)/, "").trim());

  const alliances = $("#alliances tbody tr")
    .map((_, element) => {
      const row = $(element);
      const cells = row.children("td");
      const tag = row
        .find(".nm a")
        .text()
        .replace(/^\[|\]$/g, "")
        .trim();
      return {
        rank: numberFrom(cells.eq(0).text()),
        tag,
        name: row.find(".an").text().trim() || tag,
        power: parseAmount(cells.eq(3).text()),
        members: parseAmount(cells.eq(4).text()),
        medianFurnace:
          row
            .find(".c-fc .fc")
            .contents()
            .filter((_, node) => node.type === "text")
            .text()
            .trim() ||
          row.find(".c-fc img").attr("alt") ||
          row.find(".c-fc .fc").text().trim(),
        castleWins: /^\d+$/.test(row.find(".c-w").text().trim())
          ? parseAmount(row.find(".c-w").text())
          : null,
      };
    })
    .get();

  const players = parseRosterRows($("#roster-list").html() ?? "");

  const furnaceConfig = JSON.parse($("#furnace script.fcc-data").text());
  const furnace = Object.entries(furnaceConfig.bands ?? {}).map(([band, data]) => {
    const levels = (data as { levels?: unknown }).levels;
    if (
      !Array.isArray(levels) ||
      !levels.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 2 &&
          row.every((n) => Number.isSafeInteger(n) && n >= 0),
      )
    ) {
      throw new Error("Furnace band structure changed");
    }
    const bandRow = $("#furnace .fcc-row").filter((_, node) => $(node).attr("data-band") === band);
    return {
      band,
      players: levels.reduce((sum, row) => sum + row[1], 0),
      label: bandRow.find(".nm").text().trim() || band.toUpperCase(),
      percentage: bandRow.find(".n.sh").text().trim(),
      levels,
    };
  });

  const svs = $("#svs .sp-cyc")
    .map((_, element) => {
      const row = $(element);
      const opponentPath = row.find(".vs a").attr("href") ?? "";
      if (!/^\/state\/\d+$/.test(opponentPath)) throw new Error("Invalid SvS opponent");
      const side = row.find(".sp-side");
      const result = row.find(".sp-pill");
      if (!side.is(".atk, .def") || !result.is(".w, .l"))
        throw new Error("SvS result structure changed");
      return {
        date: (row.attr("id") ?? "").replace(/^c-/, ""),
        opponent: Number(opponentPath.split("/").pop()),
        side: side.hasClass("atk") ? "attack" : "defense",
        result: result.hasClass("w") ? "win" : "loss",
      };
    })
    .get();
  const upcoming = $("#coming .sp-cal > li")
    .map((_, element) => ({
      dateLabel: $(element).find(".when small").text().trim(),
      title: $(element).find(".what").text().trim(),
      relativeLabel: $(element).find(".when b").text().trim(),
    }))
    .get();

  const rosterTotalText = /of\s+([\d,]+)/i.exec($("#roster .pg").text())?.[1];
  const rosterTotal = rosterTotalText ? parseAmount(rosterTotalText) : players.length;
  const sourceLinks = [
    { label: "All source alliances", path: $("#alliances .sp-links a").attr("href") },
    { label: "Transfer group", path: $("#group .sp-links a").first().attr("href") },
    { label: "Source roadmap", path: $("#coming a").attr("href") },
    { label: "State share card", path: $(".sp-hacts a").attr("href") },
  ].flatMap(({ label, path }) =>
    path?.startsWith("/") && !path.startsWith("//")
      ? [{ label, url: new URL(path, SOURCE_URL).href }]
      : [],
  );

  const snapshot = snapshotSchema.parse({
    version: PARSER_VERSION,
    stateNumber: 3496,
    fetchedAt,
    sourceUpdatedAt,
    leaderboardDateLabel: /as of ([^.]+)/i.exec($(".sp-power-note").text())?.[1]?.trim() ?? null,
    state: {
      svsRating: parseAmount($(".sp-rate-num").text()),
      prepRating: parseAmount($(".sp-split-row b").eq(0).text()),
      castleRating: parseAmount($(".sp-split-row b").eq(1).text()),
      globalRank: numberFrom(global.children("b").text()),
      rankedStates: numberFrom(global.find("i").text()),
      transferGroup: Number(/Transfer group (\d+)/.exec(group.text())?.[1]),
      transferGroupRank: numberFrom(group.children("b").text()),
      transferGroupStates: numberFrom(group.find("i").text()),
      heroGeneration: /Gen (\d+) heroes/.test(metaline)
        ? Number(/Gen (\d+) heroes/.exec(metaline)![1])
        : null,
      fireCrystalLevel: /Fire Crystal (\d+)/.test(metaline)
        ? Number(/Fire Crystal (\d+)/.exec(metaline)![1])
        : null,
      top100Power: facts.get("top-100 power"),
      top100Kills: facts.get("top-100 kills") ?? null,
      top100Labyrinth: facts.get("top-100 labyrinth") ?? null,
      top100TransferScore: facts.get("top-100 transfer score") ?? null,
      top100TroopsPower: facts.get("top-100 troops power") ?? null,
      top100TechPower: facts.get("top-100 tech power") ?? null,
      top100ChiefGearPower: facts.get("top-100 chief gear power") ?? null,
    },
    alliances,
    players,
    furnace,
    coveredPlayers: furnace.reduce((sum, row) => sum + row.players, 0),
    svs,
    upcoming,
    sections: parseSourceSections($),
    sourceLinks,
    coverage: {
      rosterTotal,
      rosterPages: Math.max(1, Math.ceil(rosterTotal / 50)),
      rosterComplete: players.length === rosterTotal,
      furnaceComplete: false,
    },
  });
  if (
    snapshot.state.globalRank > snapshot.state.rankedStates ||
    snapshot.state.transferGroupRank > snapshot.state.transferGroupStates
  ) {
    throw new Error("Inconsistent source ranks");
  }
  if (
    new Set(players.map((row) => row.chiefId).filter(Boolean)).size !==
      players.filter((row) => row.chiefId).length ||
    players.some((row, index) => row.rank !== index + 1) ||
    new Set(svs.map((row) => row.date)).size !== svs.length
  ) {
    throw new Error("Duplicate identities or inconsistent source ranking");
  }
  return snapshot;
}
