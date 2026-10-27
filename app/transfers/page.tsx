import { Map, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getTransferWindows, getTransferGuides, getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeading, Tag, EmptyState } from "@/components/site/primitives";
import { formatUtcDateTime } from "@/lib/state";

export default async function TransfersPage() {
  const [settings, windows, guides] = await Promise.all([
    getStateSettings(),
    getTransferWindows(true),
    getTransferGuides(true),
  ]);

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Section>
          <SectionHeading
            eyebrow="Transfer Information"
            title="Transfer Windows & Guides"
            description="Everything you need to know about transferring to State 3496."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/transfers/route" className="surface border border-border p-5 hover:border-primary">
              <h2 className="font-display text-lg font-semibold">Route planner</h2>
              <p className="mt-2 text-sm text-muted-foreground">Find a path between states using published transfer groups.</p>
            </Link>
            <Link href="/transfers/power-guide" className="surface border border-border p-5 hover:border-primary">
              <h2 className="font-display text-lg font-semibold">Power reduction guide</h2>
              <p className="mt-2 text-sm text-muted-foreground">Compare reversible and permanent actions before transferring.</p>
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold">Active Transfer Windows</h2>
            {windows.length === 0 ? (
              <EmptyState className="mt-4" description="No transfer windows currently open." />
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {windows.map((window) => (
                  <div key={window.id} className="surface rounded-lg border border-border p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg font-semibold">{window.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{window.transferType}</p>
                      </div>
                      <Tag tone={window.status === "open" ? "green" : "muted"}>
                        {window.status}
                      </Tag>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span>
                          {formatUtcDateTime(window.startsAt)} - {formatUtcDateTime(window.endsAt)}
                        </span>
                      </div>
                      {window.openSpots && (
                        <p className="text-sm">
                          <span className="font-medium">{window.openSpots}</span> spots available
                        </p>
                      )}
                      {window.eligibilityRange && (
                        <p className="text-sm">
                          Eligibility: <span className="font-medium">{window.eligibilityRange}</span>
                        </p>
                      )}
                    </div>

                    {window.notes && (
                      <p className="mt-4 text-sm text-muted-foreground">{window.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold">Transfer Guides</h2>
            {guides.length === 0 ? (
              <EmptyState className="mt-4" description="No guides available yet." />
            ) : (
              <div className="mt-4 space-y-4">
                {guides.map((guide) => (
                  <div key={guide.id} className="surface rounded-lg border border-border p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg font-semibold">{guide.title}</h3>
                        <Tag tone="muted" className="mt-1">
                          {guide.actionKind}
                        </Tag>
                      </div>
                      <Map className="size-5 text-muted-foreground" />
                    </div>

                    {guide.body && <p className="mt-4">{guide.body}</p>}

                    {guide.riskNote && (
                      <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3">
                        <AlertCircle className="size-5 text-amber-500" />
                        <p className="text-sm text-amber-500">{guide.riskNote}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>
    </SiteLayout>
  );
}
