import { getTimelineEvents, getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeading, EmptyState } from "@/components/site/primitives";
import { formatUtcDate } from "@/lib/state";

export default async function TimelinePage() {
  const [settings, events] = await Promise.all([
    getStateSettings(),
    getTimelineEvents(true),
  ]);

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Section>
          <SectionHeading
            eyebrow="Server History"
            title="Timeline"
            description="Key events and milestones in our state's history."
          />

          {events.length === 0 ? (
            <EmptyState className="mt-6" description="No timeline events yet." />
          ) : (
            <div className="mt-6 space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="surface flex gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="size-3 rounded-full bg-primary" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-semibold">{event.title}</h3>
                        <p className="label-mono mt-1 text-sm text-muted-foreground">
                          {formatUtcDate(event.eventDate)}
                          {event.serverDay && ` · Day ${event.serverDay}`}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                        {event.category}
                      </span>
                    </div>
                    {event.description && (
                      <p className="mt-2 text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </SiteLayout>
  );
}
