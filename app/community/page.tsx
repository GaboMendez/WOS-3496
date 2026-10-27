import { getCreators, getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeading, Tag, EmptyState } from "@/components/site/primitives";

export default async function CommunityPage() {
  const [settings, creators] = await Promise.all([
    getStateSettings(),
    getCreators(true),
  ]);

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Section>
          <SectionHeading
            eyebrow="Content Creators"
            title="Community"
            description="Streamers, YouTubers, and content creators from our state."
          />

          {creators.length === 0 ? (
            <EmptyState
              className="mt-6"
              description="No creators added yet. Submit your channel in Discord."
            />
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((creator) => (
                <div
                  key={creator.id}
                  className="surface flex flex-col rounded-lg border border-border p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{creator.name}</h3>
                      {creator.handle && (
                        <p className="label-mono mt-1 text-sm text-muted-foreground">
                          {creator.handle}
                        </p>
                      )}
                    </div>
                  </div>

                  {creator.bio && <p className="mt-3 text-sm text-muted-foreground">{creator.bio}</p>}

                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {creator.platform && (
                      <Tag tone="muted">{creator.platform}</Tag>
                    )}
                    {creator.contentType && (
                      <Tag tone="muted">{creator.contentType}</Tag>
                    )}
                  </div>

                  {creator.url && (
                    <a
                      href={creator.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-4 inline-block text-sm text-steel hover:underline"
                    >
                      Visit Channel →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </SiteLayout>
  );
}
