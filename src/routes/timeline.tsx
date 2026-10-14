import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  PageHeader,
  DataPoint,
  EmptyState,
  LoadingRows,
  Tag,
} from "@/components/site/primitives";
import { stateSettingsQuery, serverDay, formatUtcDate } from "@/lib/state";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Heroes",
  "Pets",
  "Fire Crystal",
  "Events",
  "Systems",
  "Sunfire",
  "SvS",
  "State History",
];

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Server Timeline — State 3496" },
      {
        name: "description",
        content:
          "Live server-day progression for State 3496: heroes, pets, fire crystal, systems, SvS and state history milestones.",
      },
      { property: "og:title", content: "Server Timeline — State 3496" },
      {
        property: "og:description",
        content: "Server day, hero era and the chronological milestone record for State 3496.",
      },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const { data: settings } = useQuery(stateSettingsQuery);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["timeline_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeline_events")
        .select("*")
        .eq("published", true)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const day = serverDay(settings?.launch_date);
  const events = (q.data ?? []).filter(
    (e) =>
      (category === "All" || e.category === category) &&
      (search.trim() === "" ||
        `${e.title} ${e.description ?? ""}`.toLowerCase().includes(search.toLowerCase())),
  );
  const nextMilestone = (q.data ?? []).find(
    (e) => e.event_date && Date.parse(`${e.event_date}T00:00:00Z`) > Date.now(),
  );

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Progression"
        title="State timeline"
        description="Server day is calculated in UTC from the recorded launch date. Milestones are entered by the admin team."
      />
      <Section>
        <div className="grid gap-4 sm:grid-cols-3">
          <DataPoint label="Current server day" value={day ? `Day ${day}` : "Launch date not set"} />
          <DataPoint label="Current hero era" value={settings?.hero_generation ?? "Not set"} />
          <DataPoint
            label="Next known milestone"
            value={nextMilestone?.title ?? "—"}
            {...(nextMilestone?.event_date
              ? { hint: formatUtcDate(nextMilestone.event_date) }
              : {})}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Chip active={category === "All"} onClick={() => setCategory("All")}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
          <label className="ml-auto flex items-center gap-2 rounded-xs border border-input bg-card px-3 py-2">
            <Search className="size-3.5 text-muted-foreground" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search milestones"
              aria-label="Search milestones"
              className="w-40 bg-transparent text-sm outline-none"
            />
          </label>
        </div>

        <div className="mt-8">
          {q.isLoading ? (
            <LoadingRows rows={5} />
          ) : events.length === 0 ? (
            <EmptyState description="No timeline entries have been published for this view yet." />
          ) : (
            <ol className="relative border-l border-border pl-6">
              {events.map((e) => {
                const isPast = e.event_date
                  ? Date.parse(`${e.event_date}T00:00:00Z`) <= Date.now()
                  : false;
                const isCurrent = day != null && e.server_day != null && e.server_day === day;
                return (
                  <li key={e.id} className="relative pb-8 last:pb-0">
                    <span
                      className={cn(
                        "absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-background",
                        isCurrent ? "bg-ember" : isPast ? "bg-steel" : "bg-muted-foreground/40",
                      )}
                      aria-hidden
                    />
                    <div className={cn("surface p-4", !isPast && "border-dashed")}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag tone={isCurrent ? "ember" : "steel"}>{e.category}</Tag>
                        <span className="data-mono text-xs text-muted-foreground">
                          {formatUtcDate(e.event_date)}
                          {e.server_day != null ? ` · Day ${e.server_day}` : ""}
                        </span>
                        {isCurrent ? <Tag tone="gold">Current</Tag> : null}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold">{e.title}</h3>
                      {e.description ? (
                        <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                          {e.description}
                        </p>
                      ) : null}
                      {e.image_url ? (
                        <img
                          src={e.image_url}
                          alt=""
                          loading="lazy"
                          className="mt-3 max-h-64 w-full rounded-xs object-cover"
                        />
                      ) : null}
                      {e.source_url ? (
                        <a
                          href={e.source_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-3 inline-flex items-center gap-1 text-sm text-steel hover:underline"
                        >
                          Source <ExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Section>
    </SiteLayout>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "label-mono rounded-xs border px-2.5 py-1.5 transition-colors",
        active ? "border-steel bg-steel text-steel-foreground" : "border-border hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
