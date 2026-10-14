import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  PageHeader,
  SectionHeading,
  EmptyState,
  LoadingRows,
} from "@/components/site/primitives";
import { stateSettingsQuery } from "@/lib/state";

const GROUPS = [
  { key: "roles", label: "Field roles" },
  { key: "etiquette", label: "Battle etiquette" },
  { key: "rallies", label: "Joining rallies" },
  { key: "comms", label: "Voice and comms" },
];

export const Route = createFileRoute("/operations")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Operations Guide — State 3496" },
      {
        name: "description",
        content:
          "How State 3496 runs coordinated events: rally leads, rally managers, comms, intel, overwatch, etiquette and voice expectations.",
      },
      { property: "og:title", content: "Operations Guide — State 3496" },
      {
        property: "og:description",
        content: "Roles, etiquette and comms expectations for coordinated State 3496 events.",
      },
    ],
  }),
  component: OperationsPage,
});

function OperationsPage() {
  const { data: settings } = useQuery(stateSettingsQuery);
  const q = useQuery({
    queryKey: ["operations_content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations_content")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const items = q.data ?? [];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Field manual"
        title="State operations"
        description="Compact reference for anyone joining a coordinated State 3496 operation."
      />
      <Section>
        {q.isLoading ? (
          <LoadingRows rows={4} />
        ) : items.length === 0 ? (
          <EmptyState description="No operations content has been published yet." />
        ) : (
          <div className="space-y-12">
            {GROUPS.map((g) => {
              const rows = items.filter((i) => i.section_key === g.key);
              if (rows.length === 0) return null;
              return (
                <div key={g.key}>
                  <SectionHeading eyebrow={g.key} title={g.label} />
                  <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((r) => (
                      <div key={r.id} className="bg-card p-5">
                        <h3 className="font-display text-base font-semibold">{r.title}</h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {r.body ?? "Information coming soon."}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {settings?.discord_url ? (
          <div className="surface mt-12 flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="font-display text-lg font-semibold">Need a rally slot or a role?</p>
              <p className="text-sm text-muted-foreground">
                Ops coordination happens in the state Discord.
              </p>
            </div>
            <a
              href={settings.discord_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <MessageCircle className="size-4" aria-hidden /> Contact ops
            </a>
          </div>
        ) : null}
      </Section>
    </SiteLayout>
  );
}
