import { getGovernanceDocuments, getGovernanceSections, getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeading, EmptyState, Tag } from "@/components/site/primitives";
import { formatUtcDate } from "@/lib/state";

export default async function GovernancePage() {
  const [settings, documents] = await Promise.all([
    getStateSettings(),
    getGovernanceDocuments(),
  ]);
  const sectionsByDocument = await Promise.all(documents.map((document) => getGovernanceSections(document.id)));

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Section>
          <SectionHeading
            eyebrow="Rules & Guidelines"
            title="Governance"
            description="State constitution, rules, and policies."
          />

          {documents.length === 0 ? (
            <EmptyState className="mt-6" description="No governance documents yet." />
          ) : (
            <div className="mt-6 grid gap-4">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="surface rounded-lg border border-border p-5"
                >
                  <div className="flex items-start justify-between gap-4"><div>
                    <h3 className="font-display text-lg font-semibold">{doc.title}</h3>
                    {doc.summary && (
                      <p className="mt-1 text-muted-foreground">{doc.summary}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Tag tone="muted">v{doc.version}</Tag>
                      {doc.effectiveDate && (
                        <span className="label-mono text-sm text-muted-foreground">
                          Effective: {formatUtcDate(doc.effectiveDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Tag tone={doc.status === "active" ? "green" : "muted"}>{doc.status}</Tag>
                  </div>
                  {sectionsByDocument[index].length ? <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
                    <nav aria-label={`${doc.title} contents`} className="text-sm"><p className="label-mono mb-2">Contents</p><ol className="space-y-2">{sectionsByDocument[index].map((section, sectionIndex) => <li key={section.id}><a href={`#${doc.id}-${section.anchor}`} className="text-steel hover:underline">{String(sectionIndex + 1).padStart(2, "0")}. {section.title}</a></li>)}</ol></nav>
                    <div className="space-y-7">{sectionsByDocument[index].map((section, sectionIndex) => <section key={section.id} id={`${doc.id}-${section.anchor}`} className="scroll-mt-24 border-t border-border pt-4"><p className="label-mono">Section {String(sectionIndex + 1).padStart(2, "0")}</p><h4 className="mt-2 font-display text-lg font-semibold">{section.title}</h4><p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{section.body || "Information coming soon."}</p></section>)}</div>
                  </div> : <EmptyState className="mt-5" description="This document has no published sections yet." />}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </SiteLayout>
  );
}
