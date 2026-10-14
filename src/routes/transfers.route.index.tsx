import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  PageHeader,
  EmptyState,
  LoadingRows,
  Tag,
} from "@/components/site/primitives";

export const Route = createFileRoute("/transfers/route/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Transfer Route Planner — State 3496" },
      {
        name: "description",
        content:
          "Plan a multi-hop state transfer into State 3496 using the recorded transfer groups and windows.",
      },
      { property: "og:title", content: "Transfer Route Planner — State 3496" },
      {
        property: "og:description",
        content: "Find the shortest recorded transfer path between two states.",
      },
    ],
  }),
  component: RoutePlanner,
});

type Group = {
  id: string;
  name: string;
  states: number[];
  window_label: string | null;
  notes: string | null;
};

type Hop = { from: number; to: number; group: Group };

function RoutePlanner() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("3496");
  const [submitted, setSubmitted] = useState<{ from: number; to: number } | null>(null);

  const q = useQuery({
    queryKey: ["transfer_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfer_groups")
        .select("*")
        .eq("published", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Group[];
    },
  });

  const groups = useMemo(() => q.data ?? [], [q.data]);

  const result = useMemo(() => {
    if (!submitted) return null;
    return findRoute(groups, submitted.from, submitted.to);
  }, [groups, submitted]);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Transfers"
        title="Route planner"
        description="Works out the shortest path between two states using the transfer groups recorded by the State 3496 team."
      />
      <Section>
        <Link to="/transfers" className="label-mono text-steel hover:underline">
          Back to transfer hub
        </Link>

        <form
          className="surface mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const f = Number(from);
            const t = Number(to);
            if (!Number.isFinite(f) || !Number.isFinite(t) || !f || !t) return;
            setSubmitted({ from: f, to: t });
          }}
        >
          <label className="block">
            <span className="label-mono mb-1 block">From state</span>
            <input
              inputMode="numeric"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="e.g. 1204"
              className="w-full rounded-xs border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="label-mono mb-1 block">To state</span>
            <input
              inputMode="numeric"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xs border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Find route <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </form>

        {q.isLoading ? (
          <div className="mt-8">
            <LoadingRows rows={2} />
          </div>
        ) : groups.length === 0 ? (
          <div className="mt-8">
            <EmptyState description="No transfer group datasets have been published yet, so routes cannot be calculated." />
          </div>
        ) : null}

        {submitted && result ? (
          result.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="No recorded route"
                description={`No published transfer group connects state ${submitted.from} to state ${submitted.to}. A route may still exist in game.`}
              />
            </div>
          ) : (
            <div className="mt-8">
              <div className="mb-4 flex items-start gap-3 border-l-2 border-gold bg-gold/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>
                  Window dates, power caps and pass requirements change. Treat this as a planning
                  aid and confirm each hop before you move.
                </p>
              </div>
              <ol className="space-y-3">
                {result.map((hop, i) => (
                  <li key={i} className="surface flex flex-wrap items-center gap-3 p-4">
                    <span className="data-mono text-sm text-muted-foreground">
                      Hop {i + 1}
                    </span>
                    <span className="data-mono text-base font-medium">
                      {hop.from} <ArrowRight className="inline size-3" aria-hidden /> {hop.to}
                    </span>
                    <Tag tone="steel">{hop.group.name}</Tag>
                    {hop.group.window_label ? (
                      <Tag tone="muted">{hop.group.window_label}</Tag>
                    ) : null}
                    {hop.group.notes ? (
                      <span className="w-full text-sm text-muted-foreground">
                        {hop.group.notes}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          )
        ) : null}

        <div className="mt-12">
          <p className="label-mono mb-3">Published transfer groups</p>
          {groups.length === 0 ? (
            <EmptyState description="No datasets recorded." />
          ) : (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="label-mono px-4 py-3 font-normal">Group</th>
                    <th className="label-mono px-4 py-3 font-normal">Window</th>
                    <th className="label-mono px-4 py-3 font-normal">States</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{g.name}</td>
                      <td className="px-4 py-3">{g.window_label ?? "—"}</td>
                      <td className="data-mono px-4 py-3 text-muted-foreground">
                        {(g.states ?? []).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>
    </SiteLayout>
  );
}

/** Breadth-first shortest path across states that share a transfer group. */
function findRoute(groups: Group[], from: number, to: number): Hop[] {
  if (from === to) return [];
  const queue: number[] = [from];
  const prev = new Map<number, Hop>();
  const seen = new Set<number>([from]);

  while (queue.length) {
    const current = queue.shift()!;
    for (const group of groups) {
      const states = group.states ?? [];
      if (!states.includes(current)) continue;
      for (const next of states) {
        if (seen.has(next)) continue;
        seen.add(next);
        prev.set(next, { from: current, to: next, group });
        if (next === to) {
          const path: Hop[] = [];
          let cursor: number = to;
          for (;;) {
            const hop: Hop | undefined = prev.get(cursor);
            if (!hop) break;
            path.unshift(hop);
            if (hop.from === from) break;
            cursor = hop.from;
          }
          return path;
        }
        queue.push(next);
      }
    }
  }
  return [];
}
