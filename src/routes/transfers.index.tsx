import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
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
import { stateSettingsQuery, formatUtcDateTime } from "@/lib/state";

export const Route = createFileRoute("/transfers/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "State Transfers — State 3496" },
      {
        name: "description",
        content:
          "Transfer window status, eligibility range, open spots and power cap guidance for moving into State 3496.",
      },
      { property: "og:title", content: "State Transfers — State 3496" },
      {
        property: "og:description",
        content: "Windows, eligibility and practical guidance for transferring into State 3496.",
      },
    ],
  }),
  component: TransfersPage,
});

const TYPES = [
  { key: "ordinary", label: "Ordinary invitations" },
  { key: "special", label: "Special invitations" },
  { key: "group", label: "Small groups" },
  { key: "alliance", label: "Full-alliance transfers" },
];

function TransfersPage() {
  const { data: settings } = useQuery(stateSettingsQuery);
  const q = useQuery({
    queryKey: ["transfer_windows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfer_windows")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const windows = q.data ?? [];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Transfer hub"
        title="Moving into State 3496"
        description="Window status, eligibility and the practical steps for each kind of transfer. Confirm details in Discord before spending anything."
      />
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DataPoint label="Recruiting status" value={settings?.recruiting_status ?? "Unknown"} />
          <DataPoint label="Eligibility range" value={settings?.eligibility_range ?? "Not set"} />
          <DataPoint label="Open spots" value={settings?.transfer_spots ?? "—"} />
          <DataPoint label="Transfer group" value={settings?.transfer_group ?? "Not set"} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {settings?.power_cap_note ??
            "Power cap guidance has not been published yet — ask in Discord before transferring."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {settings?.discord_url ? (
            <a
              href={settings.discord_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <MessageCircle className="size-4" aria-hidden /> Ask about a transfer
            </a>
          ) : null}
          <Link
            to="/transfers/route"
            className="inline-flex items-center gap-2 rounded-xs border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Route planner <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <Link
            to="/transfers/power-guide"
            className="inline-flex items-center gap-2 rounded-xs border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Power reduction guide <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionHeading eyebrow="Windows" title="Current and upcoming windows" />
        {q.isLoading ? (
          <LoadingRows />
        ) : windows.length === 0 ? (
          <EmptyState description="No transfer windows have been published yet." />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="label-mono px-4 py-3 font-normal">Window</th>
                  <th className="label-mono px-4 py-3 font-normal">Status</th>
                  <th className="label-mono px-4 py-3 font-normal">Phase</th>
                  <th className="label-mono px-4 py-3 font-normal">Opens</th>
                  <th className="label-mono px-4 py-3 font-normal">Closes</th>
                  <th className="label-mono px-4 py-3 font-normal">Notes</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((w) => (
                  <tr key={w.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{w.name}</td>
                    <td className="px-4 py-3">
                      <Tag tone={w.status === "open" ? "gold" : "muted"}>{w.status}</Tag>
                    </td>
                    <td className="px-4 py-3">{w.phase ?? "—"}</td>
                    <td className="data-mono px-4 py-3">{formatUtcDateTime(w.starts_at)}</td>
                    <td className="data-mono px-4 py-3">{formatUtcDateTime(w.ends_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{w.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section className="pt-0">
        <SectionHeading
          eyebrow="Pathways"
          title="Guidance by transfer type"
          description="Each pathway has different requirements. Published guidance appears under its type."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {TYPES.map((t) => {
            const items = windows.filter((w) => w.transfer_type === t.key);
            return (
              <div key={t.key} className="surface p-5">
                <p className="label-mono">{t.key}</p>
                <h3 className="mt-1 font-display text-lg font-semibold">{t.label}</h3>
                {items.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Information coming soon for this pathway.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {items.map((w) => (
                      <li key={w.id} className="border-t border-border pt-3 text-sm">
                        <p className="font-medium">{w.name}</p>
                        <p className="text-muted-foreground">{w.notes ?? "—"}</p>
                        {w.eligibility_range ? (
                          <p className="label-mono mt-1">Eligibility {w.eligibility_range}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </SiteLayout>
  );
}
