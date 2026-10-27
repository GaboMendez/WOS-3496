import { getOperationsContent, getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeading, EmptyState } from "@/components/site/primitives";

export default async function OperationsPage() {
  const [settings, content] = await Promise.all([
    getStateSettings(),
    getOperationsContent(true),
  ]);

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Section>
          <SectionHeading
            eyebrow="Operations Guide"
            title="Operations"
            description="Rally protocols, communications, and state procedures."
          />

          {content.length === 0 ? (
            <EmptyState className="mt-6" description="No operations content yet." />
          ) : (
            <div className="mt-6 space-y-6">
              {content.map((item) => (
                <div key={item.id} className="surface rounded-lg border border-border p-5">
                  <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                  <span className="label-mono mt-1 block text-sm text-muted-foreground">
                    {item.sectionKey}
                  </span>
                  {item.body && <p className="mt-4">{item.body}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </SiteLayout>
  );
}
