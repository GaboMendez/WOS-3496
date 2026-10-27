import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { getAllianceBySlug, getAllianceEvents, getAllianceLeaders, getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, Section, Tag } from "@/components/site/primitives";
import { formatPower } from "@/lib/state";
import { AllianceEvents } from "./AllianceEvents";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AllianceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, alliance] = await Promise.all([
    getStateSettings(),
    getAllianceBySlug(slug),
  ]);

  if (!alliance) {
    notFound();
  }

  const [leaders, events] = await Promise.all([getAllianceLeaders(alliance.id), getAllianceEvents(alliance.id)]);

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Link
          href="/alliances"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Alliances
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display text-3xl font-bold">
                    [{alliance.tag}] {alliance.name}
                  </h1>
                  <p className="mt-2 text-muted-foreground">{alliance.description}</p>
                </div>
                <Shield className="size-8 text-primary" />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Tag tone={alliance.recruitingStatus === "open" ? "green" : "muted"}>
                  {alliance.recruitingStatus}
                </Tag>
                {alliance.playstyle && <Tag tone="muted">{alliance.playstyle}</Tag>}
                {alliance.timezoneLabel && <Tag tone="muted">{alliance.timezoneLabel}</Tag>}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="label-mono text-muted-foreground">Power</p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    {formatPower(alliance.power)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="label-mono text-muted-foreground">Open Spots</p>
                  <p className="mt-1 font-display text-2xl font-bold">{alliance.openSpots}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="label-mono text-muted-foreground">SvS Contribution</p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {alliance.svsContribution || "—"}
                  </p>
                </div>
              </div>

              {alliance.discordUrl && (
                <div className="mt-8">
                  <a
                    href={alliance.discordUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Join Discord
                  </a>
                </div>
              )}
              <h2 className="mt-10 font-display text-xl font-semibold">Recurring events</h2>
              {events.length ? <AllianceEvents events={events} /> : <EmptyState className="mt-4" description="No recurring event times have been published for this alliance." />}
            </Section>
          </div>

          <div>
            <Section>
              <h2 className="font-display text-lg font-semibold">Quick Info</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="label-mono text-muted-foreground">Playstyle</dt>
                  <dd className="mt-1">{alliance.playstyle || "—"}</dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground">Timezone</dt>
                  <dd className="mt-1">{alliance.timezoneLabel || "—"}</dd>
                </div>
                {alliance.hqCoordinates && (
                  <div>
                    <dt className="label-mono text-muted-foreground">HQ Location</dt>
                    <dd className="mt-1 font-mono">{alliance.hqCoordinates}</dd>
                  </div>
                )}
              </dl>
              <h2 className="mt-10 font-display text-lg font-semibold">Leadership</h2>
              {leaders.length ? <ul className="mt-3 divide-y divide-border border-y border-border">{leaders.map((leader) => <li key={leader.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{leader.name}</p><p className="label-mono text-muted-foreground">{leader.discordHandle || "No contact listed"}</p></div><Tag>{leader.rankTitle}</Tag></li>)}</ul> : <EmptyState className="mt-3" description="Leadership contacts have not been published." />}
            </Section>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
