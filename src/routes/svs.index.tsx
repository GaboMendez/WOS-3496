import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  PageHeader,
  SectionHeading,
  DataPoint,
  EmptyState,
  LoadingRows,
  Tag,
} from "@/components/site/primitives";
import { formatUtcDate } from "@/lib/state";

export const Route = createFileRoute("/svs/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "SvS Records & Stories — State 3496" },
      {
        name: "description",
        content:
          "State versus State record for State 3496: prep and battle results, scores, opponent history and match stories.",
      },
      { property: "og:title", content: "SvS Records & Stories — State 3496" },
      {
        property: "og:description",
        content: "Prep and battle records, scores and match stories for State 3496.",
      },
    ],
  }),
  component: SvsPage,
});

type SortKey = "event_date" | "opponent" | "battle_score";

function SvsPage() {
  const [sort, setSort] = useState<SortKey>("event_date");
  const [asc, setAsc] = useState(false);

  const cycles = useQuery({
    queryKey: ["svs_cycles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("svs_cycles")
        .select("*")
        .eq("published", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stories = useQuery({
    queryKey: ["state_stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("state_stories")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = [...(cycles.data ?? [])].sort((a, b) => {
    const av = a[sort] ?? "";
    const bv = b[sort] ?? "";
    const cmp = av > bv ? 1 : av < bv ? -1 : 0;
    return asc ? cmp : -cmp;
  });

  const prepWins = rows.filter((r) => r.prep_result === "win").length;
  const prepLosses = rows.filter((r) => r.prep_result === "loss").length;
  const battleWins = rows.filter((r) => r.battle_result === "win").length;
  const battleLosses = rows.filter((r) => r.battle_result === "loss").length;
  const latest = [...rows].sort((a, b) => (a.event_date ?? "") < (b.event_date ?? "") ? 1 : -1)[0];

  function toggle(key: SortKey) {
    if (sort === key) setAsc((v) => !v);
    else {
      setSort(key);
      setAsc(false);
    }
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Warfront"
        title="SvS records and stories"
        description="Every recorded State versus State cycle, with the scores entered by the State 3496 admin team."
      />
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DataPoint
            label="Prep record"
            value={prepWins + prepLosses ? `${prepWins}W · ${prepLosses}L` : "—"}
          />
          <DataPoint
            label="Battle record"
            value={battleWins + battleLosses ? `${battleWins}W · ${battleLosses}L` : "—"}
          />
          <DataPoint
            label="Latest score"
            value={
              latest?.battle_score != null
                ? `${Number(latest.battle_score).toLocaleString()} – ${latest.opponent_battle_score != null ? Number(latest.opponent_battle_score).toLocaleString() : "?"}`
                : "—"
            }
          />
          <DataPoint label="Cycles recorded" value={rows.length || "—"} />
        </div>

        <div className="mt-10">
          <SectionHeading eyebrow="Record" title="Opponent history" />
          {cycles.isLoading ? (
            <LoadingRows rows={4} />
          ) : rows.length === 0 ? (
            <EmptyState description="No SvS cycles have been recorded yet." />
          ) : (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <SortTh onClick={() => toggle("opponent")}>Opponent</SortTh>
                    <SortTh onClick={() => toggle("event_date")}>Date</SortTh>
                    <th className="label-mono px-4 py-3 font-normal">Prep</th>
                    <th className="label-mono px-4 py-3 font-normal">Battle</th>
                    <SortTh onClick={() => toggle("battle_score")}>Score</SortTh>
                    <th className="label-mono px-4 py-3 font-normal">Story</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{c.opponent}</td>
                      <td className="data-mono px-4 py-3">{formatUtcDate(c.event_date)}</td>
                      <td className="px-4 py-3">
                        <Result value={c.prep_result} />
                      </td>
                      <td className="px-4 py-3">
                        <Result value={c.battle_result} />
                      </td>
                      <td className="data-mono px-4 py-3">
                        {c.battle_score != null
                          ? `${Number(c.battle_score).toLocaleString()} – ${c.opponent_battle_score != null ? Number(c.opponent_battle_score).toLocaleString() : "?"}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/svs/$slug"
                          params={{ slug: c.slug }}
                          className="text-steel hover:underline"
                        >
                          Match story
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-14">
          <SectionHeading
            eyebrow="Editorial"
            title="State stories"
            description="Highlighted wins, lessons and community moments published by the admin team."
          />
          {stories.isLoading ? (
            <LoadingRows rows={2} />
          ) : (stories.data ?? []).length === 0 ? (
            <EmptyState description="No state stories have been published yet." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(stories.data ?? []).map((s) => (
                <article key={s.id} className="surface p-5">
                  <div className="flex items-center gap-2">
                    {s.featured ? <Tag tone="gold">Featured</Tag> : null}
                    <span className="label-mono">{formatUtcDate(s.published_at)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.summary ?? ""}</p>
                  {s.body ? (
                    <details className="mt-3">
                      <summary className="label-mono cursor-pointer text-steel">Read story</summary>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {s.body}
                      </p>
                    </details>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </Section>
    </SiteLayout>
  );
}

function SortTh({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th className="px-4 py-3 font-normal">
      <button type="button" onClick={onClick} className="label-mono hover:text-foreground">
        {children} ↕
      </button>
    </th>
  );
}

function Result({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <Tag tone={value === "win" ? "gold" : value === "loss" ? "ember" : "muted"}>{value}</Tag>;
}
