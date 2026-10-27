import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSvsCycleBySlug, getSvsStoryMetrics, getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, Tag } from "@/components/site/primitives";
import { formatUtcDate } from "@/lib/state";
import { SvsMetrics } from "./SvsMetrics";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SvsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, cycle] = await Promise.all([
    getStateSettings(),
    getSvsCycleBySlug(slug),
  ]);

  if (!cycle) {
    notFound();
  }

  const metrics = await getSvsStoryMetrics(cycle.id);

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Link
          href="/svs"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to SvS Records
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section>
              <h1 className="font-display text-3xl font-bold">vs {cycle.opponent}</h1>
              <p className="mt-2 text-muted-foreground">
                {formatUtcDate(cycle.eventDate)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Tag tone={cycle.prepResult === "win" ? "green" : cycle.prepResult === "loss" ? "red" : "muted"}>
                  Prep: {cycle.prepResult || "—"}
                </Tag>
                <Tag tone={cycle.battleResult === "win" ? "green" : cycle.battleResult === "loss" ? "red" : "muted"}>
                  Battle: {cycle.battleResult || "—"}
                </Tag>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="label-mono text-muted-foreground">Our Prep Score</p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    {cycle.prepScore?.toLocaleString() || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="label-mono text-muted-foreground">Our Battle Score</p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    {cycle.battleScore?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>

              {cycle.storyTitle && (
                <div className="mt-8">
                  <h2 className="font-display text-xl font-semibold">{cycle.storyTitle}</h2>
                  {cycle.storyIntro && (
                    <p className="mt-2 text-muted-foreground">{cycle.storyIntro}</p>
                  )}
                  {cycle.storyBody && <p className="mt-4">{cycle.storyBody}</p>}
                </div>
              )}
              <SvsMetrics metrics={metrics} opponent={cycle.opponent} />
            </Section>
          </div>

          <div>
            <Section>
              <h2 className="font-display text-lg font-semibold">Battle Stats</h2>
              <dl className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <dt className="label-mono text-muted-foreground">Prep Result</dt>
                  <dd>
                    <Tag tone={cycle.prepResult === "win" ? "green" : cycle.prepResult === "loss" ? "red" : "muted"}>
                      {cycle.prepResult || "—"}
                    </Tag>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="label-mono text-muted-foreground">Battle Result</dt>
                  <dd>
                    <Tag tone={cycle.battleResult === "win" ? "green" : cycle.battleResult === "loss" ? "red" : "muted"}>
                      {cycle.battleResult || "—"}
                    </Tag>
                  </dd>
                </div>
                {cycle.opponentPrepScore && (
                  <div className="flex justify-between">
                    <dt className="label-mono text-muted-foreground">Opponent Prep</dt>
                    <dd className="font-mono">{cycle.opponentPrepScore.toLocaleString()}</dd>
                  </div>
                )}
                {cycle.opponentBattleScore && (
                  <div className="flex justify-between">
                    <dt className="label-mono text-muted-foreground">Opponent Battle</dt>
                    <dd className="font-mono">{cycle.opponentBattleScore.toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </Section>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
