"use client";

import { useMemo, useState } from "react";
import type { SourcePlayer, WosguruSnapshot } from "@/lib/wosguru/model";
import { furnaceLabel } from "@/lib/wosguru/format";

export function PlayerRoster({
  players,
  furnacePlayers,
}: {
  players: SourcePlayer[];
  furnacePlayers: WosguruSnapshot["furnacePlayers"];
}) {
  const [query, setQuery] = useState("");
  const [alliance, setAlliance] = useState("");
  const [furnace, setFurnace] = useState("");
  const [mode, setMode] = useState("power");
  const [page, setPage] = useState(1);
  const source = useMemo<SourcePlayer[]>(
    () =>
      mode === "power"
        ? players
        : [...furnacePlayers]
            .sort((a, b) => b.power - a.power)
            .map((row, index) => ({
              rank: index + 1,
              chiefId: row.chiefId,
              name: row.name || "Not named",
              allianceTag: row.allianceTag,
              furnaceLevel: furnaceLabel(row.level),
              power: row.power,
              exactPower: row.power,
              numericFurnaceLevel: row.level,
              furnaceBand: row.band,
            })),
    [mode, players, furnacePlayers],
  );
  const tags = useMemo(
    () => [...new Set(source.flatMap((row) => (row.allianceTag ? [row.allianceTag] : [])))].sort(),
    [source],
  );
  const levels = useMemo(
    () => [...new Set(source.map((row) => row.furnaceLevel).filter(Boolean))].sort(),
    [source],
  );
  const filtered = useMemo(
    () =>
      source.filter(
        (row) =>
          (!alliance || row.allianceTag === alliance) &&
          (!furnace || row.furnaceLevel === furnace) &&
          (!query.trim() ||
            `${row.name} ${row.chiefId ?? ""} ${row.allianceTag ?? ""}`
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase())),
      ),
    [source, query, alliance, furnace],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 50));
  const currentPage = Math.min(page, pages);
  const shown = filtered.slice((currentPage - 1) * 50, currentPage * 50);
  const control = "min-w-0 border border-input bg-background px-3 py-2 text-sm text-foreground";
  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={control}
          aria-label="Search players"
          placeholder="Search player, Chief ID or alliance"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <select
          className={control}
          aria-label="Filter alliance"
          value={alliance}
          onChange={(event) => {
            setAlliance(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All alliances</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <select
          className={control}
          aria-label="Filter furnace"
          value={furnace}
          onChange={(event) => {
            setFurnace(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All furnace levels</option>
          {levels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <select
          className={control}
          aria-label="Player dataset"
          value={mode}
          onChange={(event) => {
            setMode(event.target.value);
            setAlliance("");
            setFurnace("");
            setPage(1);
          }}
        >
          <option value="power">Source power rankings</option>
          <option value="furnace" disabled={!furnacePlayers.length}>
            Every furnace record
          </option>
        </select>
      </div>
      <p className="mb-3 text-xs text-muted-foreground" role="status">
        {filtered.length.toLocaleString()} matching records ·{" "}
        {mode === "power"
          ? "Ranks come from the source roster."
          : "Entry numbers order the furnace records by exact power."}{" "}
        Approximate values are marked ≈.
      </p>
      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {[
                mode === "power" ? "Rank" : "Entry",
                "Player",
                "Chief ID",
                "Alliance",
                "Furnace",
                "Power",
              ].map((title) => (
                <th key={title} className="label-mono whitespace-nowrap px-4 py-3 font-normal">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((row) => (
              <tr key={row.rank}>
                <td className="data-mono px-4 py-3">{row.rank}</td>
                <td className="px-4 py-3">{row.name}</td>
                <td className="data-mono px-4 py-3 text-muted-foreground">{row.chiefId ?? "—"}</td>
                <td className="px-4 py-3">{row.allianceTag ?? "—"}</td>
                <td className="data-mono px-4 py-3">{row.furnaceLevel || "—"}</td>
                <td className="data-mono whitespace-nowrap px-4 py-3">
                  {row.exactPower === null ? "≈ " : ""}
                  {(row.exactPower ?? row.power).toLocaleString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!shown.length && (
        <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
          No matching players.
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-4 text-sm">
        <button
          className="border border-border px-3 py-2 disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => setPage(currentPage - 1)}
        >
          Previous
        </button>
        <span className="data-mono" aria-live="polite">
          Page {currentPage} of {pages}
        </span>
        <button
          className="border border-border px-3 py-2 disabled:opacity-40"
          disabled={currentPage >= pages}
          onClick={() => setPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
