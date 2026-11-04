import Link from "next/link";
import type { ReactNode } from "react";
import { getStateSettings } from "@/lib/actions";
import { getSourceData } from "@/lib/wosguru/server";
import { formatPower, formatUtcDate } from "@/lib/state";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SourceNote } from "@/components/site/SourceNote";
import { PlayerRoster } from "./PlayerRoster";
import { SourceSections } from "./SourceSections";
import { furnaceLabel } from "@/lib/wosguru/format";
import {
  DataPoint,
  EmptyState,
  PageHeader,
  Section,
  SectionHeading,
  Tag,
} from "@/components/site/primitives";

export const metadata = {
  title: "State intelligence — State 3496",
  description: "Dated State 3496 ratings, alliance power, leading players and SvS results.",
};

export default async function IntelligencePage() {
  const [settings, source] = await Promise.all([getStateSettings(), getSourceData()]);
  const data = source.snapshot;
  return (
    <SiteLayout settings={settings}>
      <PageHeader
        eyebrow="State 3496"
        title="State intelligence"
        description="State ratings, alliance strength and leading players from the latest available public snapshot."
      />
      {!data ? (
        <Section>
          <EmptyState description="State intelligence will appear after the first successful refresh." />
          <Link href="/" className="mt-4 inline-block text-steel hover:underline">
            Back to the portal
          </Link>
        </Section>
      ) : (
        <>
          <Section>
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
              <DataPoint
                label="SvS rating"
                value={data.state.svsRating}
                hint={`#${data.state.globalRank} of ${data.state.rankedStates} ranked states`}
              />
              <DataPoint label="Preparation" value={data.state.prepRating} />
              <DataPoint label="Castle rating" value={data.state.castleRating} />
              <DataPoint
                label="Transfer group"
                value={data.state.transferGroup}
                hint={`#${data.state.transferGroupRank} of ${data.state.transferGroupStates}`}
              />
              <DataPoint label="Top 100 power" value={formatPower(data.state.top100Power)} />
              <DataPoint label="Top 100 kills" value={formatPower(data.state.top100Kills)} />
              <DataPoint
                label="Top 100 Labyrinth"
                value={data.state.top100Labyrinth?.toLocaleString() ?? "—"}
              />
              <DataPoint
                label="Top 100 transfer score"
                value={formatPower(data.state.top100TransferScore)}
              />
              <DataPoint
                label="Top 100 troops power"
                value={formatPower(data.state.top100TroopsPower)}
              />
              <DataPoint
                label="Top 100 tech power"
                value={formatPower(data.state.top100TechPower)}
              />
              <DataPoint
                label="Top 100 chief gear"
                value={formatPower(data.state.top100ChiefGearPower)}
              />
            </div>
            <SourceNote
              snapshot={data}
              failed={source.status === "error" || source.status === "blocked"}
            />
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <a href="/api/intelligence?download=1" className="text-steel hover:underline">
                Download complete snapshot (JSON)
              </a>
              {data.sourceLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-steel hover:underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
            {source.status === "collecting" && (
              <p className="mt-3 text-sm text-steel">
                A complete refresh is being collected. This is the last published snapshot.
              </p>
            )}
            <nav
              aria-label="Intelligence sections"
              className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-steel"
            >
              {data.sections.map((section) => (
                <a key={section.id} href={`#source-${section.id}`} className="hover:underline">
                  {section.title}
                </a>
              ))}
            </nav>
          </Section>
          <Section>
            <SectionHeading
              eyebrow="Alliance strength"
              title="Leading alliances"
              description="Source rankings do not establish NAP status, farm ownership or recruiting availability."
            />
            <Table
              labels={["Rank", "Alliance", "Power", "Members", "Median furnace", "Castle wins"]}
            >
              {data.alliances.map((row) => (
                <tr key={row.tag}>
                  <Cell>{row.rank}</Cell>
                  <Cell>
                    <span className="font-medium">
                      [{row.tag}] {row.name}
                    </span>
                  </Cell>
                  <Cell>{formatPower(row.power)}</Cell>
                  <Cell>{row.members}</Cell>
                  <Cell>{row.medianFurnace}</Cell>
                  <Cell>{row.castleWins ?? "—"}</Cell>
                </tr>
              ))}
            </Table>
          </Section>
          <Section>
            <SectionHeading
              eyebrow="Player rankings"
              title="All available players"
              description={`${data.players.length.toLocaleString()} of ${(data.coverage?.rosterTotal ?? data.coveredPlayers).toLocaleString()} source roster records imported. The source covers leading alliances and strong outsiders; it is not a census of the whole state.`}
            />
            <PlayerRoster players={data.players} furnacePlayers={data.furnacePlayers} />
            <p className="mt-3 text-xs text-muted-foreground">
              {data.furnacePlayers.length.toLocaleString()} exact-power furnace records imported.
              All records are available through the filters, page controls and JSON download.
            </p>
          </Section>
          <Section>
            <SectionHeading
              eyebrow="Progression"
              title="Furnace distribution"
              description={`Counts cover ${data.coveredPlayers.toLocaleString()} observed players, rather than the entire state population.`}
            />
            <div className="grid gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
              {data.furnace.map((row) => (
                <DataPoint
                  key={row.band}
                  label={row.label || row.band.toUpperCase().replace(/^P/, "FURNACE ")}
                  value={row.players}
                  hint={`${row.percentage ? row.percentage + " · " : ""}observed players`}
                />
              ))}
            </div>
            <details className="surface mt-4 border border-border p-4">
              <summary className="cursor-pointer font-display text-sm">
                Every furnace sublevel
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {data.furnace.map((band) => (
                  <div key={band.band}>
                    <p className="label-mono text-primary">{band.label || band.band}</p>
                    {band.levels.map(([level, count]) => (
                      <p key={level} className="data-mono mt-1 text-sm">
                        {furnaceLabel(level)}: {count}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          </Section>
          <SourceSections sections={data.sections} />
          <Section>
            <SectionHeading
              eyebrow="Battle history"
              title="SvS castle results"
              description="Preparation and castle ratings are distinct from game scores."
            />
            <Table labels={["Date", "Opponent", "Side", "Castle result"]}>
              {data.svs.map((row) => (
                <tr key={row.date}>
                  <Cell>{formatUtcDate(row.date)}</Cell>
                  <Cell>State #{row.opponent}</Cell>
                  <Cell>{row.side}</Cell>
                  <Cell>
                    <Tag tone={row.result === "win" ? "gold" : "ember"}>{row.result}</Tag>
                  </Cell>
                </tr>
              ))}
            </Table>
          </Section>
          <Section>
            <SectionHeading
              eyebrow="Source schedule"
              title="Upcoming events"
              description="Dates and forecasts are shown as published in the source snapshot. Confirm current schedules in game."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.upcoming.map((row, index) => (
                <div key={`${row.dateLabel}-${index}`} className="surface p-4">
                  <p className="label-mono text-primary">{row.dateLabel}</p>
                  <p className="mt-2 text-sm">{row.title}</p>
                  {row.relativeLabel && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      At source capture: {row.relativeLabel}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </SiteLayout>
  );
}

function Table({ labels, children }: { labels: string[]; children: ReactNode }) {
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {labels.map((label) => (
              <th key={label} className="label-mono whitespace-nowrap px-4 py-3 font-normal">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
function Cell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}
