import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSvsCycles, getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeading, Tag, EmptyState } from "@/components/site/primitives";
import { formatUtcDate } from "@/lib/state";

export default async function SvsPage() {
  const [settings, svsData] = await Promise.all([
    getStateSettings(),
    getSvsCycles(true),
  ]);

  const wins = svsData.filter((c) => c.battleResult === "win").length;
  const losses = svsData.filter((c) => c.battleResult === "loss").length;

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Section>
          <SectionHeading
            eyebrow="State vs State"
            title="SvS Records"
            description="Battle history and results against rival states."
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="label-mono text-muted-foreground">Total Battles</p>
              <p className="mt-1 font-display text-2xl font-bold">{svsData.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="label-mono text-muted-foreground">Wins</p>
              <p className="mt-1 font-display text-2xl font-bold text-green-500">{wins}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="label-mono text-muted-foreground">Losses</p>
              <p className="mt-1 font-display text-2xl font-bold text-red-500">{losses}</p>
            </div>
          </div>

          {svsData.length === 0 ? (
            <EmptyState description="No SvS records yet." />
          ) : (
            <div className="surface mt-6 overflow-x-auto">
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="label-mono px-4 py-3 font-normal">Opponent</th>
                    <th className="label-mono px-4 py-3 font-normal">Date</th>
                    <th className="label-mono px-4 py-3 font-normal">Prep</th>
                    <th className="label-mono px-4 py-3 font-normal">Battle</th>
                    <th className="label-mono px-4 py-3 font-normal">Score</th>
                    <th className="label-mono px-4 py-3 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {svsData.map((cycle) => (
                    <tr key={cycle.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{cycle.opponent}</td>
                      <td className="data-mono px-4 py-3">{formatUtcDate(cycle.eventDate)}</td>
                      <td className="px-4 py-3">
                        <Tag tone={cycle.prepResult === "win" ? "green" : cycle.prepResult === "loss" ? "red" : "muted"}>
                          {cycle.prepResult || "—"}
                        </Tag>
                      </td>
                      <td className="px-4 py-3">
                        <Tag tone={cycle.battleResult === "win" ? "green" : cycle.battleResult === "loss" ? "red" : "muted"}>
                          {cycle.battleResult || "—"}
                        </Tag>
                      </td>
                      <td className="data-mono px-4 py-3">
                        {cycle.battleScore != null && cycle.opponentBattleScore != null
                          ? `${Number(cycle.battleScore).toLocaleString()} - ${Number(cycle.opponentBattleScore).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/svs/${cycle.slug}`}
                          className="inline-flex items-center gap-1 text-steel hover:underline"
                        >
                          Story <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </SiteLayout>
  );
}
