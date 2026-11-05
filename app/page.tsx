import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, MessageCircle, Shield, Swords, Users } from "lucide-react";
import {
  getStateSettings,
  getAlliances,
  getSvsCycles,
  getFeaturedCreators,
  getStateObservations,
} from "@/lib/actions";
import { calculateServerDay, formatPower, formatUtcDate, formatUtcDateTime } from "@/lib/state";
import { SiteLayout } from "@/components/site/SiteLayout";
import { groupSourceSections } from "@/lib/wosguru/placement";
import { SourceOverview } from "@/components/site/SourceData";
import { SourceSections } from "@/intelligence/SourceSections";
import { Section, SectionHeading, Tag } from "@/components/site/primitives";

export default async function HomePage() {
  const [settings, alliances, svs, creators, observed] = await Promise.all([
    getStateSettings(),
    getAlliances(true),
    getSvsCycles(true),
    getFeaturedCreators(),
    getStateObservations(),
  ]);

  const day = calculateServerDay(settings?.launchDate || null);
  const rating = settings?.svsRating ?? settings?.sourceSvsRating;
  const rank = settings?.globalRank ?? settings?.sourceGlobalRank;
  const power = settings?.top100Power ?? settings?.sourceTop100Power;
  const wins = svs.filter(
    (cycle) => (cycle.battleResult ?? cycle.sourceBattleResult) === "win",
  ).length;
  const losses = svs.filter(
    (cycle) => (cycle.battleResult ?? cycle.sourceBattleResult) === "loss",
  ).length;
  const rankedAlliances = alliances
    .filter(
      (alliance) =>
        alliance.sourceRank != null && alliance.sourceObservedAt === settings?.sourceObservedAt,
    )
    .sort((a, b) => a.sourceRank! - b.sourceRank!);
  const featuredAlliances = (rankedAlliances.length ? rankedAlliances : alliances).slice(0, 4);
  const highlights = [
    rating != null ? { label: "SvS rating", value: rating.toLocaleString() } : null,
    rank != null ? { label: "Global rank", value: `#${rank.toLocaleString()}` } : null,
    power != null ? { label: "Top 100 power", value: formatPower(power) } : null,
    wins + losses ? { label: "Castle record", value: `${wins}W · ${losses}L` } : null,
  ].filter((item): item is { label: string; value: string } => item !== null);
  const heroEra =
    settings?.heroGeneration ??
    (settings?.sourceHeroGeneration != null ? `Generation ${settings.sourceHeroGeneration}` : null);
  const transferGroup =
    settings?.transferGroup ??
    (settings?.sourceTransferGroup != null ? `Group ${settings.sourceTransferGroup}` : null);
  const status = [
    day
      ? { label: "Server day", value: `Day ${day}` }
      : settings?.launchMonth
        ? { label: "Opened", value: settings.launchMonth }
        : null,
    heroEra ? { label: "Hero era", value: heroEra } : null,
    transferGroup ? { label: "Transfer group", value: transferGroup } : null,
    settings?.recruitingStatus ? { label: "Recruiting", value: settings.recruitingStatus } : null,
    { label: "Times shown in", value: settings?.timezone ?? "UTC" },
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <SiteLayout settings={settings}>
      <section className="relative isolate overflow-hidden border-b border-border bg-card">
        <Image
          src={settings?.heroImageUrl || "/images/state-hero.jpg"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <p className="label-mono text-primary">
              Whiteout Survival · Unofficial community portal
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              {settings?.displayName ?? "State 3496"}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/90 sm:text-base">
              {settings?.tagline ??
                "Your home for alliances, battles and everything happening in State 3496."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/alliances"
                className="inline-flex items-center gap-2 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Shield className="size-4" aria-hidden /> Explore alliances{" "}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/transfers"
                className="inline-flex items-center gap-2 border border-border bg-card/90 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Transfer information
              </Link>
              {settings?.discordUrl && (
                <a
                  href={settings.discordUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 border border-border bg-card/90 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <MessageCircle className="size-4" aria-hidden /> Join Discord
                </a>
              )}
            </div>
          </div>
          {highlights.length > 0 && (
            <div
              className="grid grid-cols-2 gap-px border border-border bg-border/80"
              aria-label="State highlights"
            >
              {highlights.map((item) => (
                <div key={item.label} className="bg-background/90 p-4">
                  <p className="label-mono text-muted-foreground">{item.label}</p>
                  <p className="data-mono mt-2 text-xl font-semibold text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-10 gap-y-3 px-4 py-4 sm:px-6">
          {status.map((item) => (
            <div key={item.label}>
              <p className="label-mono text-muted-foreground">{item.label}</p>
              <p className="data-mono mt-1 text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:gap-10 lg:py-10">
        <div className="min-w-0 space-y-10 lg:col-span-2">
          <section aria-labelledby="home-alliances">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="label-mono text-primary">State 3496</p>
                <h2 id="home-alliances" className="mt-2 text-xl font-semibold sm:text-2xl">
                  {rankedAlliances.length ? "Leading alliances" : "Our alliances"}
                </h2>
              </div>
              <Link
                href="/alliances"
                className="label-mono inline-flex items-center gap-1 text-steel hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                All alliances <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
            {featuredAlliances.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {featuredAlliances.map((alliance) => {
                  const current =
                    alliance.sourceObservedAt != null &&
                    alliance.sourceObservedAt === settings?.sourceObservedAt;
                  const alliancePower = alliance.power ?? (current ? alliance.sourcePower : null);
                  return (
                    <Link
                      key={alliance.id}
                      href={`/alliances/${alliance.slug}`}
                      className="group surface flex min-w-0 flex-col border border-border p-4 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="label-mono normal-case text-primary">
                            [{alliance.tag}]
                            {current && alliance.sourceRank != null
                              ? ` · #${alliance.sourceRank}`
                              : ""}
                          </p>
                          <h3 className="mt-2 break-words font-display text-lg font-semibold">
                            {alliance.name}
                          </h3>
                        </div>
                        <Shield
                          className="size-5 shrink-0 text-muted-foreground group-hover:text-primary"
                          aria-hidden
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        {alliancePower != null && (
                          <span>
                            <span className="text-foreground">{formatPower(alliancePower)}</span>{" "}
                            power
                          </span>
                        )}
                        {current && alliance.sourceMembers != null && (
                          <span>
                            <span className="text-foreground">{alliance.sourceMembers}</span>{" "}
                            members
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                Alliance information will appear here when available.
              </p>
            )}
          </section>

          <section aria-labelledby="home-svs">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="label-mono text-primary">Battle history</p>
                <h2 id="home-svs" className="mt-2 text-xl font-semibold sm:text-2xl">
                  Recent SvS results
                </h2>
              </div>
              <Link
                href="/svs"
                className="label-mono inline-flex items-center gap-1 text-steel hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                All results <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
            {svs.length ? (
              <div className="divide-y divide-border border border-border bg-card">
                {svs.slice(0, 4).map((cycle) => {
                  const result = cycle.battleResult ?? cycle.sourceBattleResult;
                  return (
                    <Link
                      key={cycle.id}
                      href={`/svs/${cycle.slug}`}
                      className="flex flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                    >
                      <Swords className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          vs{" "}
                          {/^[0-9]+$/.test(cycle.opponent)
                            ? `State ${cycle.opponent}`
                            : cycle.opponent}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatUtcDate(cycle.eventDate ?? null)}
                        </p>
                      </div>
                      {result && (
                        <Tag
                          tone={result === "win" ? "gold" : result === "loss" ? "ember" : "muted"}
                        >
                          {result}
                        </Tag>
                      )}
                      <ArrowRight className="size-4 text-steel" aria-hidden />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                Battle results will appear here when available.
              </p>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-7" aria-label="State resources and events">
          {settings?.currentEvent || observed?.upcoming.length ? (
            <section className="border border-border bg-card p-5" aria-labelledby="home-calendar">
              <div className="flex items-center gap-2 text-primary">
                <CalendarDays className="size-4" aria-hidden />
                <p className="label-mono">State calendar</p>
              </div>
              <h2 id="home-calendar" className="mt-2 text-xl font-semibold">
                Events & milestones
              </h2>
              {settings?.currentEvent && (
                <div className="mt-4 border-l-2 border-primary pl-3">
                  <p className="label-mono text-muted-foreground">Current event</p>
                  <p className="mt-1 font-medium">{settings.currentEvent}</p>
                  {settings.nextEventDate && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Next milestone: {formatUtcDateTime(settings.nextEventDate)}
                    </p>
                  )}
                </div>
              )}
              {observed && observed.upcoming.length > 0 && (
                <>
                  <div className="mt-4 divide-y divide-border">
                    {observed.upcoming.slice(0, 4).map((event, index) => (
                      <div key={`${event.dateLabel}-${index}`} className="flex gap-3 py-3">
                        <p className="label-mono w-14 shrink-0 text-primary">{event.dateLabel}</p>
                        <p className="text-sm leading-relaxed">{event.title}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Calendar last updated {formatUtcDateTime(observed.sourceUpdatedAt)}. Confirm
                    dates in game.
                  </p>
                </>
              )}
              <Link
                href="/timeline"
                className="label-mono mt-4 inline-flex items-center gap-1 text-steel hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                View timeline <ArrowRight className="size-3" aria-hidden />
              </Link>
            </section>
          ) : null}

          <section aria-labelledby="home-explore">
            <p className="label-mono text-primary">Find your way</p>
            <h2 id="home-explore" className="mt-2 text-xl font-semibold">
              Explore the state
            </h2>
            <div className="mt-4 divide-y divide-border border border-border">
              {[
                {
                  href: "/community#players",
                  label: "Player rankings",
                  hint: "Power and furnace levels",
                  icon: Users,
                },
                {
                  href: "/transfers",
                  label: "Transfer information",
                  hint: "Windows, groups and guidance",
                  icon: ArrowRight,
                },
                {
                  href: "/governance",
                  label: "Governance",
                  hint: "State rules and conduct",
                  icon: Shield,
                },
                {
                  href: "/operations",
                  label: "Operations",
                  hint: "Rally and communication roles",
                  icon: Swords,
                },
              ].map(({ href, label, hint, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 bg-card p-4 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                >
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <ArrowRight
                    className="size-4 text-steel transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {creators.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Community"
            title="State 3496 creators"
            description="Guides, recaps and clips made by members of the state."
            action={
              <Link
                href="/community"
                className="label-mono inline-flex items-center gap-1 text-steel hover:underline"
              >
                Community page <ArrowRight className="size-3" aria-hidden />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creators.slice(0, 6).map((creator) => (
              <div key={creator.id} className="surface border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{creator.name}</p>
                  {creator.platform && <Tag tone="muted">{creator.platform}</Tag>}
                </div>
                {creator.handle && (
                  <p className="label-mono mt-1 text-muted-foreground">{creator.handle}</p>
                )}
                {creator.contentType && (
                  <p className="mt-2 text-sm text-muted-foreground">{creator.contentType}</p>
                )}
                {creator.url && (
                  <a
                    href={creator.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 inline-block text-sm text-steel hover:underline"
                  >
                    Visit channel
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
      {observed && settings && (
        <>
          <SourceOverview snapshot={observed} settings={settings} />
          <SourceSections sections={groupSourceSections(observed.sections).overview} />
        </>
      )}
    </SiteLayout>
  );
}
