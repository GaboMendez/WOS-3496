import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  EmptyState,
  LoadingRows,
  DataPoint,
  Tag,
} from "@/components/site/primitives";
import { formatPower, utcTimeToLocal } from "@/lib/state";

export const Route = createFileRoute("/alliances/$slug")({
  head: ({ params }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `${params.slug.toUpperCase()} — Alliance profile · State 3496` },
      {
        name: "description",
        content:
          "Alliance profile for State 3496: leadership, power, open spots, HQ coordinates and recurring event times in UTC.",
      },
      { property: "og:title", content: `Alliance profile — State 3496` },
      {
        property: "og:description",
        content: "Leadership, power, open spots and event times for this State 3496 alliance.",
      },
    ],
  }),
  component: AllianceDetail,
});

function AllianceDetail() {
  const { slug } = Route.useParams();
  const [localTime, setLocalTime] = useState(false);

  const q = useQuery({
    queryKey: ["alliance", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alliances")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [leaders, events] = await Promise.all([
        supabase.from("alliance_leaders").select("*").eq("alliance_id", data.id).order("sort_order"),
        supabase.from("alliance_events").select("*").eq("alliance_id", data.id).order("sort_order"),
      ]);
      return { alliance: data, leaders: leaders.data ?? [], events: events.data ?? [] };
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
            title="Alliance not found"
            description="This alliance profile is not published, or the link is out of date."
          />
          <Link to="/alliances" className="mt-4 inline-block text-sm text-steel hover:underline">
            Back to the directory
          </Link>
        </Section>
      </SiteLayout>
    );
  }

  const { alliance, leaders, events } = q.data;

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card">
        {alliance.banner_url ? (
          <img
            src={alliance.banner_url}
            alt={`${alliance.name} banner`}
            loading="lazy"
            className="h-48 w-full object-cover sm:h-64"
          />
        ) : null}
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <Link
            to="/alliances"
            className="label-mono inline-flex items-center gap-1 text-steel hover:underline"
          >
            <ArrowLeft className="size-3" aria-hidden /> Directory
          </Link>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            <span className="data-mono text-steel">[{alliance.tag}]</span> {alliance.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag tone={alliance.recruiting_status === "Open" ? "gold" : "muted"}>
              {alliance.recruiting_status}
            </Tag>
            {alliance.playstyle ? <Tag tone="steel">{alliance.playstyle}</Tag> : null}
            {alliance.timezone_label ? <Tag tone="muted">{alliance.timezone_label}</Tag> : null}
          </div>
          {alliance.discord_url ? (
            <a
              href={alliance.discord_url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-2 rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <MessageCircle className="size-4" aria-hidden /> Contact leadership
            </a>
          ) : null}
        </div>
      </div>

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DataPoint label="Alliance power" value={formatPower(Number(alliance.power))} />
          <DataPoint label="Open spots" value={alliance.open_spots ?? "—"} />
          <DataPoint label="HQ coordinates" value={alliance.hq_coordinates ?? "—"} />
          <DataPoint label="SvS contribution" value={alliance.svs_contribution ?? "—"} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-xl font-semibold">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {alliance.description ?? alliance.short_description ?? "Information coming soon."}
            </p>

            <h2 className="mt-10 text-xl font-semibold">Recurring events</h2>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLocalTime((v) => !v)}
                className="label-mono rounded-xs border border-border px-2 py-1 hover:bg-accent"
                aria-pressed={localTime}
              >
                {localTime ? "Showing local time" : "Showing UTC"}
              </button>
            </div>
            {events.length === 0 ? (
              <div className="mt-4">
                <EmptyState description="No recurring event times have been published for this alliance." />
              </div>
            ) : (
              <div className="surface mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="label-mono px-4 py-3 font-normal">Event</th>
                      <th className="label-mono px-4 py-3 font-normal">Time</th>
                      <th className="label-mono px-4 py-3 font-normal">Days</th>
                      <th className="label-mono px-4 py-3 font-normal">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{e.name}</td>
                        <td className="data-mono px-4 py-3">
                          {localTime
                            ? (utcTimeToLocal(e.utc_time) ?? e.utc_time ?? "—")
                            : e.utc_time
                              ? `${e.utc_time} UTC`
                              : "—"}
                        </td>
                        <td className="px-4 py-3">{e.days ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{e.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside>
            <h2 className="text-xl font-semibold">Leadership</h2>
            {leaders.length === 0 ? (
              <div className="mt-3">
                <EmptyState description="Leadership contacts have not been published." />
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {leaders.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{l.name}</p>
                      <p className="label-mono">{l.discord_handle ?? "No contact listed"}</p>
                    </div>
                    <Tag tone="steel">{l.rank_title}</Tag>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </Section>
    </SiteLayout>
  );
}
