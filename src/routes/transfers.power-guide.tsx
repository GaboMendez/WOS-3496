import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RotateCcw, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  PageHeader,
  SectionHeading,
  EmptyState,
  LoadingRows,
} from "@/components/site/primitives";

export const Route = createFileRoute("/transfers/power-guide")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Power Reduction Guide — State 3496 Transfers" },
      {
        name: "description",
        content:
          "How to reduce power before a state transfer: reversible actions, permanent actions and the risks flagged for each.",
      },
      { property: "og:title", content: "Power Reduction Guide — State 3496" },
      {
        property: "og:description",
        content: "Reversible versus permanent power reduction steps before transferring.",
      },
    ],
  }),
  component: PowerGuide,
});

function PowerGuide() {
  const q = useQuery({
    queryKey: ["transfer_guides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfer_guides")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const items = q.data ?? [];
  const reversible = items.filter((i) => i.action_kind === "reversible");
  const permanent = items.filter((i) => i.action_kind === "permanent");

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Transfers"
        title="Power reduction guide"
        description="Some power reductions can be undone after the move. Others cannot. Read the risk note on every step before acting."
      />
      <Section>
        <Link to="/transfers" className="label-mono text-steel hover:underline">
          Back to transfer hub
        </Link>

        <div className="mt-6 flex items-start gap-3 border-l-2 border-ember bg-ember/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden />
          <p>
            Caps, eligibility and window dates change between seasons. Confirm current requirements
            in Discord before removing anything permanently.
          </p>
        </div>

        {q.isLoading ? (
          <div className="mt-8">
            <LoadingRows rows={4} />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8">
            <EmptyState description="No power reduction guidance has been published yet." />
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Low risk"
                title="Reversible actions"
                description="Power you can rebuild after the transfer completes."
              />
              <GuideList items={reversible} icon="reversible" />
            </div>
            <div>
              <SectionHeading
                eyebrow="High risk"
                title="Permanent actions"
                description="Power or resources you will not get back."
              />
              <GuideList items={permanent} icon="permanent" />
            </div>
          </div>
        )}
      </Section>
    </SiteLayout>
  );
}

function GuideList({
  items,
  icon,
}: {
  items: { id: string; title: string; body: string | null; risk_note: string | null }[];
  icon: "reversible" | "permanent";
}) {
  if (items.length === 0) return <EmptyState description="Nothing published in this category." />;
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.id} className="surface p-4">
          <div className="flex items-center gap-2">
            {icon === "reversible" ? (
              <RotateCcw className="size-4 text-steel" aria-hidden />
            ) : (
              <Lock className="size-4 text-ember" aria-hidden />
            )}
            <p className="font-display font-semibold">{i.title}</p>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {i.body ?? "Information coming soon."}
          </p>
          {i.risk_note ? (
            <p className="label-mono mt-3 text-ember">Risk · {i.risk_note}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
