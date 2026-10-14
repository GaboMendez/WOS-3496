import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, Shield, Map as MapIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  SectionHeading,
  DataPoint,
  EmptyState,
  LoadingRows,
  Tag,
} from "@/components/site/primitives";
import {
  stateSettingsQuery,
  serverDay,
  formatPower,
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/state";
import heroImage from "@/assets/state-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "State 3496 — Whiteout Survival Community Portal" },
      {
        name: "description",
        content:
          "State command center for State 3496: alliance directory, governance, transfer guidance, SvS records and the server timeline.",
      },
      { property: "og:title", content: "State 3496 — Community Portal" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "Alliances, governance, transfers, SvS records and server timeline for the State 3496 community.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: settings } = useQuery(stateSettingsQuery);

  const alliances = useQuery({
    queryKey: ["alliances", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alliances")
        .select("id, slug, tag, name, power, open_spots, recruiting_status")
        .eq("published", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const svs = useQuery({
    queryKey: ["svs_cycles", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("svs_cycles")
        .select("*")
        .eq("published", true)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const creators = useQuery({
    queryKey: ["creators", "featured"],
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

  const day = serverDay(settings?.launch_date);
  const totalPower = (alliances.data ?? []).reduce((sum, a) => sum + Number(a.power ?? 0), 0);
  const openSpots = (alliances.data ?? []).reduce((sum, a) => sum + Number(a.open_spots ?? 0), 0);
  const prepWins = (svs.data ?? []).filter((c) => c.prep_result === "win").length;
  const prepLosses = (svs.data ?? []).filter((c) => c.prep_result === "loss").length;
  const battleWins = (svs.data ?? []).filter((c) => c.battle_result === "win").length;
  const battleLosses = (svs.data ?? []).filter((c) => c.battle_result === "loss").length;
  const latest = svs.data?.[0];

  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden border-b border-border">
        <img
          src={settings?.hero_image_url || heroImage}
          alt="State 3496 frozen frontier"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="label-mono text-primary">
            Whiteout Survival · Unofficial community portal
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-foreground sm:text-6xl">
            {settings?.display_name ?? "State 3496"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground sm:text-base">
            {settings?.tagline ??
              "State intelligence, alliance data and transfer guidance for the State 3496 player base."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {settings?.discord_url ? (
              <a
                href={settings.discord_url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle className="size-4" aria-hidden /> Join Discord
              </a>
            ) : null}
            <Link
              to="/alliances"
              className="inline-flex items-center gap-2 border border-border bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Shield className="size-4" aria-hidden /> Explore alliances
            </Link>
            <Link
              to="/transfers"
              className="inline-flex items-center gap-2 border border-border bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <MapIcon className="size-4" aria-hidden /> Transfer information
            </Link>
          </div>
        </div>
      </section>

      {/* status strip */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
          <StripItem label="Server day" value={day ? `Day ${day}` : "Not set"} />
          <StripItem label="Hero era" value={settings?.hero_generation ?? "Not set"} />
          <StripItem label="Recruiting" value={settings?.recruiting_status ?? "Unknown"} />
          <StripItem label="Transfer group" value={settings?.transfer_group ?? "Not set"} />
          <StripItem label="Times shown in" value={settings?.timezone ?? "UTC"} />
          <StripItem label="Last updated" value={formatUtcDateTime(settings?.updated_at)} />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-px bg-border lg:grid-cols-12">
      <Section className="min-w-0 bg-background lg:order-2 lg:col-span-6 lg:!px-6 lg:!py-8">
        <SectionHeading
          eyebrow="State at a glance"
          title="Current state metrics"
          description="Every figure below is drawn from records entered by the State 3496 admin team."
        />
        {alliances.isLoading ? (
          <LoadingRows rows={2} />
        ) : (
          <div className="grid gap-px bg-border sm:grid-cols-2">
            <DataPoint label="Active alliances" value={alliances.data?.length || "—"} />
            <DataPoint label="Combined power" value={formatPower(totalPower)} />
            <DataPoint label="Open spots" value={openSpots || "—"} />
            <DataPoint
              label="SvS prep record"
              value={prepWins + prepLosses ? `${prepWins}W · ${prepLosses}L` : "—"}
            />
            <DataPoint
              label="SvS battle record"
              value={battleWins + battleLosses ? `${battleWins}W · ${battleLosses}L` : "—"}
            />
            <DataPoint
              label="Latest prep score"
              value={latest?.prep_score ? Number(latest.prep_score).toLocaleString() : "—"}
              hint={latest ? `vs ${latest.opponent}` : undefined}
            />
          </div>
        )}
      </Section>

      <Section className="min-w-0 bg-background lg:order-4 lg:col-span-6 lg:!px-6 lg:!py-8">
        <SectionHeading
          eyebrow="Field report"
          title="Recent SvS results"
          action={
            <Link to="/svs" className="label-mono inline-flex items-center gap-1 text-steel">
              All records <ArrowRight className="size-3" aria-hidden />
            </Link>
          }
        />
        {svs.isLoading ? (
          <LoadingRows />
        ) : (svs.data ?? []).length === 0 ? (
          <EmptyState description="No SvS results have been recorded for State 3496 yet." />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <Th>Opponent</Th>
                  <Th>Date</Th>
                  <Th>Prep</Th>
                  <Th>Battle</Th>
                  <Th>Score</Th>
                  <Th>Story</Th>
                </tr>
              </thead>
              <tbody>
                {(svs.data ?? []).slice(0, 5).map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <Td className="font-medium">{c.opponent}</Td>
                    <Td className="data-mono">{formatUtcDate(c.event_date)}</Td>
                    <Td>
                      <ResultTag value={c.prep_result} />
                    </Td>
                    <Td>
                      <ResultTag value={c.battle_result} />
                    </Td>
                    <Td className="data-mono">
                      {c.battle_score != null && c.opponent_battle_score != null
                        ? `${Number(c.battle_score).toLocaleString()} – ${Number(c.opponent_battle_score).toLocaleString()}`
                        : "—"}
                    </Td>
                    <Td>
                      <Link
                        to="/svs/$slug"
                        params={{ slug: c.slug }}
                        className="text-steel hover:underline"
                      >
                        Read
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section className="min-w-0 bg-background lg:order-3 lg:col-span-3 lg:row-span-2 lg:!px-5 lg:!py-8">
        <div className="space-y-8">
          <div className="border-l-2 border-primary bg-card p-4">
            <p className="label-mono">Current event</p>
            <p className="mt-2 font-display text-xl font-semibold">
              {settings?.current_event ?? "Information coming soon"}
            </p>
            <p className="mt-4 label-mono">Next milestone</p>
            <p className="data-mono mt-1 text-base">
              {formatUtcDateTime(settings?.next_event_date)}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              All event times are published in UTC.
            </p>
          </div>
          <div className="grid gap-px border border-border bg-border">
            {[
              { to: "/governance", label: "Governance", hint: "State rules and conduct" },
              { to: "/operations", label: "Operations", hint: "Rally and comms roles" },
              { to: "/timeline", label: "Timeline", hint: "Server progression" },
              { to: "/transfers", label: "Transfers", hint: "Windows and routes" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                 className="group bg-card p-4 transition-colors hover:bg-accent"
              >
                <p className="font-display text-base font-semibold">{l.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{l.hint}</p>
                <ArrowRight
                  className="mt-3 size-4 text-steel transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section className="min-w-0 bg-background lg:order-1 lg:col-span-3 lg:row-span-2 lg:!px-5 lg:!py-8">
        <SectionHeading
          eyebrow="Community"
          title="State 3496 creators"
          description="Guides, recaps and clips made by members of the state."
          action={
            <Link to="/community" className="label-mono inline-flex items-center gap-1 text-steel">
              Community page <ArrowRight className="size-3" aria-hidden />
            </Link>
          }
        />
        {creators.isLoading ? (
          <LoadingRows rows={2} />
        ) : (creators.data ?? []).length === 0 ? (
          <EmptyState description="No creators have been added yet. Submit your channel in Discord." />
        ) : (
          <div className="grid gap-3">
            {(creators.data ?? []).slice(0, 6).map((c) => (
              <div key={c.id} className="surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-semibold">{c.name}</p>
                  {c.platform ? <Tag tone="muted">{c.platform}</Tag> : null}
                </div>
                <p className="label-mono mt-1">{c.handle ?? ""}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.content_type ?? ""}</p>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 inline-block text-sm text-steel hover:underline"
                  >
                    Visit channel
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>
      </div>
    </SiteLayout>
  );
}

function StripItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-mono">{label}</p>
      <p className="data-mono text-sm font-medium">{value}</p>
    </div>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="label-mono px-4 py-3 font-normal">{children}</th>;
}

export function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function ResultTag({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = value === "win" ? "gold" : value === "loss" ? "ember" : "muted";
  return <Tag tone={tone as "gold" | "ember" | "muted"}>{value}</Tag>;
}
