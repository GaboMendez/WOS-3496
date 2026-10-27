import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle, Shield, Map as MapIcon } from "lucide-react";
import {
  getStateSettings,
  getAlliances,
  getSvsCycles,
  getFeaturedCreators,
} from "@/lib/actions";
import {
  calculateServerDay,
  formatPower,
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/state";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  SectionHeading,
  DataPoint,
  EmptyState,
  Tag,
} from "@/components/site/primitives";

export default async function HomePage() {
  // Fetch data on the server
  const [settings, alliancesData, svsData, creatorsData] = await Promise.all([
    getStateSettings(),
    getAlliances(true),
    getSvsCycles(true),
    getFeaturedCreators(),
  ]);

  const day = calculateServerDay(settings?.launchDate || null);
  const totalPower = alliancesData.reduce((sum, a) => sum + Number(a.power ?? 0), 0);
  const openSpots = alliancesData.reduce((sum, a) => sum + Number(a.openSpots ?? 0), 0);
  const prepWins = svsData.filter((c) => c.prepResult === "win").length;
  const prepLosses = svsData.filter((c) => c.prepResult === "loss").length;
  const battleWins = svsData.filter((c) => c.battleResult === "win").length;
  const battleLosses = svsData.filter((c) => c.battleResult === "loss").length;
  const latest = svsData[0];

  return (
    <SiteLayout settings={settings}>
      <section className="relative isolate overflow-hidden border-b border-border">
        <Image
          src={settings?.heroImageUrl || "/images/state-hero.jpg"}
          alt="State 3496 frozen frontier"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="label-mono text-primary">Whiteout Survival · Unofficial community portal</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-foreground sm:text-6xl">
            {settings?.displayName ?? "State 3496"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground sm:text-base">
            {settings?.tagline ??
              "State intelligence, alliance data and transfer guidance for the State 3496 player base."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {settings?.discordUrl ? (
              <a
                href={settings.discordUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle className="size-4" aria-hidden /> Join Discord
              </a>
            ) : null}
            <Link
              href="/alliances"
              className="inline-flex items-center gap-2 border border-border bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Shield className="size-4" aria-hidden /> Explore alliances
            </Link>
            <Link
              href="/transfers"
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
          <StripItem label="Hero era" value={settings?.heroGeneration ?? "Not set"} />
          <StripItem label="Recruiting" value={settings?.recruitingStatus ?? "Unknown"} />
          <StripItem label="Transfer group" value={settings?.transferGroup ?? "Not set"} />
          <StripItem label="Times shown in" value={settings?.timezone ?? "UTC"} />
          <StripItem label="Last updated" value={formatUtcDateTime(settings?.updatedAt ?? null)} />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-px bg-border lg:grid-cols-12">
        <Section className="min-w-0 bg-background lg:order-2 lg:col-span-6 lg:px-6 lg:py-8">
          <SectionHeading
            eyebrow="State at a glance"
            title="Current state metrics"
            description="Every figure below is drawn from records entered by the State 3496 admin team."
          />
          <div className="grid gap-px bg-border sm:grid-cols-2">
            <DataPoint label="Active alliances" value={alliancesData.length || "—"} />
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
              value={latest?.prepScore ? Number(latest.prepScore).toLocaleString() : "—"}
              hint={latest ? `vs ${latest.opponent}` : undefined}
            />
          </div>
        </Section>

        <Section className="min-w-0 bg-background lg:order-4 lg:col-span-6 lg:px-6 lg:py-8">
          <SectionHeading
            eyebrow="Field report"
            title="Recent SvS results"
            action={
              <Link href="/svs" className="label-mono inline-flex items-center gap-1 text-steel">
                All records <ArrowRight className="size-3" aria-hidden />
              </Link>
            }
          />
          {svsData.length === 0 ? (
            <EmptyState description="No SvS results have been recorded for State 3496 yet." />
          ) : (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-160 text-sm">
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
                  {svsData.slice(0, 5).map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <Td className="font-medium">{c.opponent}</Td>
                      <Td className="data-mono">{formatUtcDate(c.eventDate ?? null)}</Td>
                      <Td>
                        <ResultTag value={c.prepResult} />
                      </Td>
                      <Td>
                        <ResultTag value={c.battleResult} />
                      </Td>
                      <Td className="data-mono">
                        {c.battleScore != null && c.opponentBattleScore != null
                          ? `${Number(c.battleScore).toLocaleString()} – ${Number(c.opponentBattleScore).toLocaleString()}`
                          : "—"}
                      </Td>
                      <Td>
                        <Link href={`/svs/${c.slug}`} className="text-steel hover:underline">
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

        <Section className="min-w-0 bg-background lg:order-3 lg:col-span-3 lg:row-span-2 lg:px-5 lg:py-8">
          <div className="space-y-8">
            <div className="border-l-2 border-primary bg-card p-4">
              <p className="label-mono">Current event</p>
              <p className="mt-2 font-display text-xl font-semibold">
                {settings?.currentEvent ?? "Information coming soon"}
              </p>
              <p className="mt-4 label-mono">Next milestone</p>
              <p className="data-mono mt-1 text-base">
                {formatUtcDateTime(settings?.nextEventDate ?? null)}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                All event times are published in UTC.
              </p>
            </div>
            <div className="grid gap-px border border-border bg-border">
              {[
                { href: "/governance", label: "Governance", hint: "State rules and conduct" },
                { href: "/operations", label: "Operations", hint: "Rally and comms roles" },
                { href: "/timeline", label: "Timeline", hint: "Server progression" },
                { href: "/transfers", label: "Transfers", hint: "Windows and routes" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
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

        <Section className="min-w-0 bg-background lg:order-1 lg:col-span-3 lg:row-span-2 lg:px-5 lg:py-8">
          <SectionHeading
            eyebrow="Community"
            title="State 3496 creators"
            description="Guides, recaps and clips made by members of the state."
            action={
              <Link
                href="/community"
                className="label-mono inline-flex items-center gap-1 text-steel"
              >
                Community page <ArrowRight className="size-3" aria-hidden />
              </Link>
            }
          />
          {creatorsData.length === 0 ? (
            <EmptyState description="No creators have been added yet. Submit your channel in Discord." />
          ) : (
            <div className="grid gap-3">
              {creatorsData.slice(0, 6).map((c) => (
                <div key={c.id} className="surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-semibold">{c.name}</p>
                    {c.platform ? <Tag tone="muted">{c.platform}</Tag> : null}
                  </div>
                  <p className="label-mono mt-1">{c.handle ?? ""}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{c.contentType ?? ""}</p>
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="label-mono px-4 py-3 font-normal">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function ResultTag({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = value === "win" ? "gold" : value === "loss" ? "ember" : "muted";
  return <Tag tone={tone as "gold" | "ember" | "muted"}>{value}</Tag>;
}
