import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  DataPoint,
  EmptyState,
  LoadingRows,
  Tag,
} from "@/components/site/primitives";
import { formatUtcDate } from "@/lib/state";

export const Route = createFileRoute("/svs/$slug")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "SvS Match Story — State 3496" },
      {
        name: "description",
        content:
          "Match story for a State 3496 SvS cycle: narrative, score timeline and alliance contributions from recorded data.",
      },
      { property: "og:title", content: "SvS Match Story — State 3496" },
      {
        property: "og:description",
        content: "Narrative, score timeline and alliance contributions for this SvS cycle.",
      },
    ],
  }),
  component: SvsStory,
});

function SvsStory() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["svs_cycle", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("svs_cycles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const metrics = await supabase
        .from("svs_story_metrics")
        .select("*")
        .eq("cycle_id", data.id)
        .order("sort_order");
      return { cycle: data, metrics: metrics.data ?? [] };
    },
  });

  if (q.isLoading) {
    return (
      <SiteLayout>
        <Section>
          <LoadingRows rows={4} />
        </Section>
      </SiteLayout>
    );
  }

  if (!q.data) {
    return (
      <SiteLayout>
        <Section>
          <EmptyState
            title="Match story not found"
            description="This SvS cycle is not published, or the link is out of date."
          />
          <Link to="/svs" className="mt-4 inline-block text-sm text-steel hover:underline">
            Back to SvS records
          </Link>
        </Section>
      </SiteLayout>
    );
  }

  const { cycle, metrics } = q.data;
  const timeline = metrics
    .filter((m) => m.metric_kind === "timeline")
    .map((m) => ({
      label: m.label,
      us: m.our_value != null ? Number(m.our_value) : null,
      them: m.opponent_value != null ? Number(m.opponent_value) : null,
    }));
  const contributions = metrics.filter((m) => m.metric_kind === "contribution");

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card">
        {cycle.image_url ? (
          <img
            src={cycle.image_url}
            alt=""
            loading="lazy"
            className="h-52 w-full object-cover sm:h-72"
          />
        ) : null}
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <Link to="/svs" className="label-mono inline-flex items-center gap-1 text-steel">
            <ArrowLeft className="size-3" aria-hidden /> SvS records
          </Link>
          <p className="label-mono mt-4">
            {formatUtcDate(cycle.event_date)} · versus {cycle.opponent}
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {cycle.story_title ?? `State 3496 vs ${cycle.opponent}`}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag tone={cycle.prep_result === "win" ? "gold" : "muted"}>
              Prep: {cycle.prep_result ?? "not recorded"}
            </Tag>
            <Tag tone={cycle.battle_result === "win" ? "gold" : "muted"}>
              Battle: {cycle.battle_result ?? "not recorded"}
            </Tag>
          </div>
        </div>
      </div>

      <Section className="max-w-4xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <DataPoint
            label="Prep score"
            value={
              cycle.prep_score != null
                ? `${Number(cycle.prep_score).toLocaleString()} – ${cycle.opponent_prep_score != null ? Number(cycle.opponent_prep_score).toLocaleString() : "?"}`
                : "—"
            }
          />
          <DataPoint
            label="Battle score"
            value={
              cycle.battle_score != null
                ? `${Number(cycle.battle_score).toLocaleString()} – ${cycle.opponent_battle_score != null ? Number(cycle.opponent_battle_score).toLocaleString() : "?"}`
                : "—"
            }
          />
        </div>

        <article className="mt-10">
          {cycle.story_intro ? (
            <p className="text-base leading-relaxed">{cycle.story_intro}</p>
          ) : null}
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {cycle.story_body ?? "The write-up for this cycle has not been published yet."}
          </p>
        </article>

        {timeline.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-xl font-semibold">Score timeline</h2>
            <p className="label-mono mt-1">Values entered by the admin team</p>
            <div className="surface mt-4 h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} width={70} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="us"
                    name="State 3496"
                    stroke="var(--color-steel)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="them"
                    name={cycle.opponent}
                    stroke="var(--color-ember)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {contributions.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-xl font-semibold">Alliance contributions</h2>
            <div className="surface mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="label-mono px-4 py-3 font-normal">Alliance</th>
                    <th className="label-mono px-4 py-3 font-normal">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{c.label}</td>
                      <td className="data-mono px-4 py-3">
                        {c.our_value != null ? Number(c.our_value).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Section>
    </SiteLayout>
  );
}
