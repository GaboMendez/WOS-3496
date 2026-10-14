import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  PageHeader,
  SectionHeading,
  EmptyState,
  LoadingRows,
  Tag,
} from "@/components/site/primitives";
import { stateSettingsQuery, formatUtcDate } from "@/lib/state";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Community & Creators — State 3496" },
      {
        name: "description",
        content:
          "Creators, guides, clips and community projects from the State 3496 player base, plus how to get featured.",
      },
      { property: "og:title", content: "Community & Creators — State 3496" },
      {
        property: "og:description",
        content: "Creators, guides and community projects from State 3496.",
      },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const { data: settings } = useQuery(stateSettingsQuery);

  const creators = useQuery({
    queryKey: ["creators", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const stories = useQuery({
    queryKey: ["state_stories", "community"],
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

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Community"
        title="Creators and projects"
        description="Members of State 3496 who make guides, recaps and clips. Links are listed, never auto-embedded."
      />
      <Section>
        {creators.isLoading ? (
          <LoadingRows rows={3} />
        ) : (creators.data ?? []).length === 0 ? (
          <EmptyState description="No creators have been added yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(creators.data ?? []).map((c) => (
              <article key={c.id} className="surface flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{c.name}</h2>
                    <p className="label-mono mt-1">{c.handle ?? ""}</p>
                  </div>
                  {c.featured ? <Tag tone="gold">Featured</Tag> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.platform ? <Tag tone="steel">{c.platform}</Tag> : null}
                  {c.content_type ? <Tag tone="muted">{c.content_type}</Tag> : null}
                </div>
                {c.bio ? (
                  <p className="mt-3 text-sm text-muted-foreground">{c.bio}</p>
                ) : null}
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex items-center gap-1 text-sm text-steel hover:underline"
                  >
                    Open profile <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section className="pt-0">
        <SectionHeading eyebrow="Library" title="Guides, recaps and projects" />
        {stories.isLoading ? (
          <LoadingRows rows={2} />
        ) : (stories.data ?? []).length === 0 ? (
          <EmptyState description="No community write-ups have been published yet." />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {(stories.data ?? []).map((s) => (
              <li key={s.id} className="py-4">
                <p className="label-mono">{formatUtcDate(s.published_at)}</p>
                <h3 className="mt-1 text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.summary ?? ""}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {settings?.discord_url ? (
        <Section className="pt-0">
          <div className="surface flex flex-wrap items-center justify-between gap-4 border-l-2 border-ember p-6">
            <div>
              <p className="font-display text-lg font-semibold">Get featured</p>
              <p className="text-sm text-muted-foreground">
                Submit your channel, guide or clip in the state Discord and an admin will review it.
              </p>
            </div>
            <a
              href={settings.discord_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <MessageCircle className="size-4" aria-hidden /> Submit in Discord
            </a>
          </div>
        </Section>
      ) : null}
    </SiteLayout>
  );
}
