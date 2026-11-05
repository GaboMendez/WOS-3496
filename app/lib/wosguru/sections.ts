import type { CheerioAPI } from "cheerio";
import type { SourceSection, SourceTable } from "./model";

type Selection = ReturnType<CheerioAPI>;
const text = (item: Selection) => item.text().replace(/\s+/g, " ").trim();
const ownText = (item: Selection) => text(item.clone().children().remove().end());
const dateText = (item: Selection) =>
  item
    .contents()
    .map((_, node) =>
      node.type === "text"
        ? node.data.trim()
        : " " +
          ("children" in node
            ? node.children.map((child) => (child.type === "text" ? child.data : "")).join("")
            : ""),
    )
    .get()
    .join("")
    .trim();

export function parseSourceSections($: CheerioAPI): SourceSection[] {
  const sections: SourceSection[] = [];
  function add(id: string, title: string, facts: string[], tables: SourceTable[]) {
    const populated = tables.filter((table) => table.rows.length);
    const notes = [...new Set(facts.filter(Boolean))];
    if (populated.length || notes.length)
      sections.push({ id, title, facts: notes, tables: populated });
  }
  const table = (title: string, columns: string[], rows: string[][]): SourceTable => ({
    title,
    columns,
    rows,
  });

  add(
    "state-profile",
    "State profile",
    [
      text($(".sp-metaline")),
      text($(".sp-rate-d")),
      ...$(".sp-prof > span")
        .map((_, el) => text($(el)))
        .get(),
      text($(".sp-rec-roles")),
      text($(".sp-rec-head")),
    ],
    [
      table(
        "All state ranks",
        ["Metric", "Rank", "Population"],
        $(".sp-ranks .sp-rk")
          .map((_, el) => {
            const item = $(el);
            return [
              [ownText(item.children("span")), text(item.children("b")), text(item.find("i"))],
            ];
          })
          .get(),
      ),
    ],
  );

  add(
    "aggregate-metrics",
    "State power and peer comparisons",
    [text($(".sp-power-note"))],
    [
      table(
        "All aggregate leaderboards",
        ["Metric", "Value", "Rank", "Grade", "Percentile", "Change", "Grading basis"],
        $(".sp-power > div")
          .map((_, el) => {
            const item = $(el);
            return [
              [
                text(item.children("span")),
                text(item.children("b")),
                text(item.find("small.rk")),
                text(item.find(".sp-gr")),
                text(item.find("small.pc")),
                text(item.children("em")),
                item.find(".sp-gr").attr("title") ?? "",
              ],
            ];
          })
          .get(),
      ),
    ],
  );

  add(
    "power-distribution",
    "Player power concentration",
    $("#players .sp-facts .sp-fact")
      .map((_, el) => text($(el)))
      .get(),
    [
      table(
        "Power among the top 50 players",
        ["Alliance", "Share", "Exact combined power"],
        $("#players .sp-share-bar > span")
          .map((_, el) => {
            const item = $(el);
            const match = /^(.+):\s*(\d+%)$/.exec(item.attr("title") ?? "");
            return match
              ? [[match[1], match[2], /flex:\s*([\d.]+)/.exec(item.attr("style") ?? "")?.[1] ?? ""]]
              : [];
          })
          .get(),
      ),
    ],
  );

  const leaderboards = $("#players .sp-mini")
    .map((_, el) => {
      const item = $(el);
      return table(
        text(item.children("h3")),
        ["Rank", "Chief ID", "Player", "Alliance", "Furnace", "Value"],
        item
          .find(".sp-prow")
          .map((_, row) => {
            const player = $(row);
            const path = player.find(".who b a").attr("href") ?? "";
            return [
              [
                text(player.children(".rk")),
                /^\/player\/\d+$/.test(path) ? path.split("/").pop()! : "",
                text(player.find(".who b")),
                text(player.find(".meta .sp-al")),
                text(player.find(".fcn")),
                text(player.children(".vl")),
              ],
            ];
          })
          .get(),
      );
    })
    .get();
  add("player-leaderboards", "Player leaderboards", [], leaderboards);

  add(
    "next-svs",
    "Next SvS and opponent forecasts",
    [
      text($("#next-svs .sd-when")),
      text($("#next-svs > .sd-facts")),
      text($("#next-svs .sd-prep > .k")),
      text($("#next-svs .sd-castle")),
      ...$("#next-svs .sd-fc p")
        .map((_, el) => text($(el)))
        .get(),
    ],
    [
      table(
        "Match stages",
        ["Stage", "Dates", "Status"],
        $("#next-svs .sd-cycle > li")
          .map((_, el) => {
            const item = $(el);
            return [
              [
                text(item.children("b")),
                text(item.children("span")),
                item.hasClass("is-now")
                  ? "Current"
                  : item.hasClass("is-done")
                    ? "Completed"
                    : "Upcoming",
              ],
            ];
          })
          .get(),
      ),
      table(
        "Castle battle UTC window",
        ["From", "To"],
        $("#next-svs [data-sd-from]")
          .map((_, el) => [[$(el).attr("data-sd-from") ?? "", $(el).attr("data-sd-to") ?? ""]])
          .get(),
      ),
      table(
        "Preparation week days",
        ["Day", "Stage", "Status"],
        $("#next-svs .sd-prep li")
          .map((_, el) => {
            const item = $(el);
            return [
              [
                text(item.children("b")),
                text(item.children("span")),
                item.hasClass("is-now")
                  ? "Current"
                  : item.hasClass("is-done")
                    ? "Completed"
                    : "Upcoming",
              ],
            ];
          })
          .get(),
      ),
      table(
        "Possible opponents — estimates",
        [
          "Rank",
          "State",
          "Draw probability",
          "SvS rating",
          "Prep win probability",
          "Castle win probability",
          "Previous meeting",
        ],
        $("#next-svs .sd-row.sd-lk")
          .map((_, el) => {
            const item = $(el);
            const path = item.find(".sd-st").attr("href") ?? "";
            return [
              [
                text(item.find(".sd-n")),
                /^\/state\/\d+$/.test(path) ? path.split("/").pop()! : text(item.find(".st")),
                text(item.find(".ch")),
                text(item.find(".rt")),
                text(item.find(".od").eq(0)),
                text(item.find(".od").eq(1)),
                /,\s*(Met .+)$/i.exec(item.find(".go").attr("aria-label") ?? "")?.[1] ??
                  (item.find(".st").text().includes("↺")
                    ? "Yes"
                    : (item.find(".st").attr("title") ?? "")),
              ],
            ];
          })
          .get(),
      ),
    ],
  );

  const points = new Map<string, string[]>();
  $("#svs svg circle title").each((_, el) => {
    const match = /^(.+?):\s*([\d,]+),\s*(.+)$/.exec(text($(el)));
    if (match) points.set(match[1], [match[1], match[2], match[3]]);
  });
  add(
    "svs-details",
    "SvS ratings and castle occupation",
    $("#svs > .sp-note, #svs > .sp-facts")
      .map((_, el) => text($(el)))
      .get(),
    [
      table("Rating history", ["Date", "SvS rating", "Outcome"], [...points.values()]),
      table(
        "Cycle rating changes",
        [
          "Date",
          "Opponent",
          "Current opponent rank",
          "Result",
          "SvS change",
          "Preparation change",
          "Castle change",
        ],
        $("#svs .sp-cyc")
          .map((_, el) => {
            const item = $(el);
            return [
              [
                (item.attr("id") ?? "").replace(/^c-/, ""),
                text(item.find(".vs a")),
                text(item.find(".vs small")),
                text(item.find(".sp-pill")),
                text(item.find(".sp-dl > bdi")),
                text(item.find(".sp-dl small em").eq(0)),
                text(item.find(".sp-dl small em").eq(1)),
              ],
            ];
          })
          .get(),
      ),
      table(
        "Castle occupation duration by cycle",
        ["Cycle date", "Alliance", "Time held"],
        $("#svs .sp-cyc .sp-hh-c")
          .map((_, el) => {
            const item = $(el);
            return [
              [
                (item.closest(".sp-cyc").attr("id") ?? "").replace(/^c-/, ""),
                text(item.children("b")),
                ownText(item),
              ],
            ];
          })
          .get(),
      ),
    ],
  );

  add(
    "castle",
    "Castle holders and presidents",
    [text($("#castle .sp-facts")), text($("#castle .sp-strip-ends"))],
    [
      table(
        "Every castle holder",
        ["Date", "Alliance", "Player", "Appointment / occupation", "SvS"],
        $("#castle .sp-hold")
          .map((_, el) => {
            const item = $(el);
            const appointment = item.find(".what").clone();
            appointment.find(".sp-tag").remove();
            return [
              [
                dateText(item.children(".d")),
                text(item.find(".who b")),
                ownText(item.find(".who")),
                text(appointment),
                item.find(".sp-tag").length ? "Yes" : "",
              ],
            ];
          })
          .get(),
      ),
      table(
        "Most terms as president",
        ["Alliance", "President", "Terms", "Supreme terms"],
        $("#castle .sp-pres-c")
          .map((_, el) => {
            const item = $(el);
            return [
              [
                text(item.find(".who b")),
                ownText(item.find(".who")),
                ownText(item.find(".n")),
                text(item.find(".n small")),
              ],
            ];
          })
          .get(),
      ),
    ],
  );

  add(
    "moves",
    "Transfers in and out",
    [text($("#moves h2 .hint"))],
    $("#moves .sp-mini")
      .map((_, el) => {
        const item = $(el);
        return table(
          text(item.children("h3")),
          [
            "Player",
            "Alliance",
            "Furnace",
            /Moved in/i.test(item.children("h3").text()) ? "From state" : "To state",
            "Power",
            "Detected between",
          ],
          item
            .find(".sp-prow")
            .map((_, row) => {
              const player = $(row);
              return [
                [
                  text(player.find(".who b")),
                  text(player.find(".meta .sp-al")),
                  text(player.find(".fcn")),
                  text(player.find(".vl > a")),
                  text(player.find(".sp-mv-pw")),
                  player.attr("title") ?? "",
                ],
              ];
            })
            .get(),
        );
      })
      .get(),
  );

  add(
    "group",
    "Transfer group and neighbouring states",
    [text($("#group .sp-lead")), text($("#group .sp-track-k"))],
    [
      table(
        "Transfer group neighbours",
        ["State", "Group rank", "SvS rating"],
        $("#group .sp-near-s")
          .map((_, el) => {
            const item = $(el);
            return [
              [
                (item.attr("href") ?? "").split("/").pop() ?? "",
                text(item.children("b")),
                text(item.children("small")),
              ],
            ];
          })
          .get(),
      ),
    ],
  );
  const peers = $(".sp-panel:not([id])").filter((_, el) =>
    /Opened alongside/.test($(el).children("h2").text()),
  );
  add(
    "peer-states",
    "States opened alongside 3496",
    [],
    [
      table(
        "Peer states",
        ["State", "SvS rating"],
        peers
          .find(".sp-near-s")
          .map((_, el) => [
            [($(el).attr("href") ?? "").split("/").pop() ?? "", text($(el).children("small"))],
          ])
          .get(),
      ),
    ],
  );

  add(
    "furnace-details",
    "Detailed furnace levels",
    [text($("#furnace .fcc-note"))],
    [
      table(
        "Furnace summary",
        ["Metric", "Value", "Details"],
        $("#furnace .sp-tile")
          .map((_, el) => {
            const item = $(el);
            return [[text(item.find(".k")), text(item.find(".v")), text(item.find(".d"))]];
          })
          .get(),
      ),
    ],
  );
  return sections;
}
