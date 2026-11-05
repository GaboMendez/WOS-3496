import type { WosguruSnapshot } from "@/lib/wosguru/model";
import type { StateSetting } from "@/db/schema";
import { furnaceLabel } from "@/lib/wosguru/format";
import { formatPower } from "@/lib/state";
import { PlayerRoster } from "@/intelligence/PlayerRoster";
import { DataPoint, Section, SectionHeading } from "./primitives";
import { SourceNote } from "./SourceNote";

type Observations = Pick<WosguruSnapshot, "sourceUpdatedAt" | "leaderboardDateLabel" | "furnace" | "furnacePlayers" | "coveredPlayers" | "upcoming">;
type Props = { snapshot: Observations };

export function SourceOverview({ snapshot, settings }: Props & { settings: StateSetting }) {
  const state = {
    svsRating: settings.svsRating ?? settings.sourceSvsRating,
    prepRating: settings.prepRating ?? settings.sourcePrepRating,
    castleRating: settings.castleRating ?? settings.sourceCastleRating,
    globalRank: settings.globalRank ?? settings.sourceGlobalRank,
    rankedStates: settings.rankedStates ?? settings.sourceRankedStates,
    transferGroup: settings.transferGroup ?? settings.sourceTransferGroup,
    transferGroupRank: settings.transferGroupRank ?? settings.sourceTransferGroupRank,
    transferGroupStates: settings.transferGroupStates ?? settings.sourceTransferGroupStates,
    top100Power: settings.top100Power ?? settings.sourceTop100Power,
    top100Kills: settings.top100Kills ?? settings.sourceTop100Kills,
    top100Labyrinth: settings.sourceTop100Labyrinth,
    top100TransferScore: settings.sourceTop100TransferScore,
    top100TroopsPower: settings.sourceTop100TroopsPower,
    top100TechPower: settings.sourceTop100TechPower,
    top100ChiefGearPower: settings.sourceTop100ChiefGearPower,
  };
  return (
    <Section>
      <div id="state-data" className="scroll-mt-24">
        <SectionHeading
          eyebrow="State overview"
          title="State ratings and power"
          description="Ratings, strength and progress across State 3496."
        />
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <DataPoint
            label="SvS rating"
            value={state.svsRating ?? "—"}
            hint={state.globalRank != null ? `#${state.globalRank} of ${state.rankedStates ?? "—"} ranked states` : undefined}
          />
          <DataPoint label="Preparation" value={state.prepRating ?? "—"} />
          <DataPoint label="Castle rating" value={state.castleRating ?? "—"} />
          <DataPoint
            label="Transfer group"
            value={state.transferGroup ?? "—"}
            hint={state.transferGroupRank != null ? `#${state.transferGroupRank} of ${state.transferGroupStates ?? "—"}` : undefined}
          />
          <DataPoint label="Top 100 power" value={formatPower(state.top100Power)} />
          <DataPoint label="Top 100 kills" value={formatPower(state.top100Kills)} />
          <DataPoint
            label="Top 100 Labyrinth"
            value={state.top100Labyrinth?.toLocaleString() ?? "—"}
          />
          <DataPoint
            label="Top 100 transfer score"
            value={formatPower(state.top100TransferScore)}
          />
          <DataPoint
            label="Top 100 troops power"
            value={formatPower(state.top100TroopsPower)}
          />
          <DataPoint label="Top 100 tech power" value={formatPower(state.top100TechPower)} />
          <DataPoint
            label="Top 100 chief gear"
            value={formatPower(state.top100ChiefGearPower)}
          />
        </div>
        <SourceNote snapshot={snapshot} />
      </div>
    </Section>
  );
}

export function SourcePlayers({ snapshot: data, players }: Props & { players: WosguruSnapshot["players"] }) {
  return (
    <>
      <Section>
        <div id="players" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Player rankings"
            title="All available players"
            description={`${players.length.toLocaleString()} players listed across leading alliances and strong outsiders. The rankings do not cover the entire state.`}
          />
          <PlayerRoster players={players} furnacePlayers={data.furnacePlayers} />
          <p className="mt-3 text-xs text-muted-foreground">
            {data.furnacePlayers.length.toLocaleString()} furnace records are available using the
            dataset filter above.
          </p>
          <SourceNote snapshot={data} />
        </div>
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
          <summary className="cursor-pointer font-display text-sm">Every furnace sublevel</summary>
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
    </>
  );
}

export function SourceSchedule({ snapshot: data }: Props) {
  return (
    <Section>
      <SectionHeading
        eyebrow="Event schedule"
        title="Upcoming events"
        description="Upcoming dates and forecasts. Confirm current schedules in game."
      />
      {data.upcoming.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.upcoming.map((row, index) => (
            <div key={`${row.dateLabel}-${index}`} className="surface p-4">
              <p className="label-mono text-primary">{row.dateLabel}</p>
              <p className="mt-2 text-sm">{row.title}</p>
              {row.relativeLabel && (
                <p className="mt-1 text-xs text-muted-foreground">
                  At last update: {row.relativeLabel}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No upcoming events are available.
        </p>
      )}
      <SourceNote snapshot={data} />
    </Section>
  );
}

