import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Section,
  PageHeader,
  EmptyState,
  LoadingRows,
  ErrorNote,
  Tag,
} from "@/components/site/primitives";
import { formatUtcDate } from "@/lib/state";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "State Governance — State 3496" },
      {
        name: "description",
        content:
          "The published governance document for State 3496: membership, protected play, facilities, presidency rotation, conduct and enforcement.",
      },
      { property: "og:title", content: "State Governance — State 3496" },
      {
        property: "og:description",
        content: "Rules, conduct and enforcement for the State 3496 community.",
      },
    ],
  }),
  component: GovernancePage,
});

function GovernancePage() {
  const q = useQuery({
    queryKey: ["governance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("governance_documents")
        .select("*")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const sections = await supabase
        .from("governance_sections")
        .select("*")
        .eq("document_id", data.id)
        .order("sort_order");
      return { doc: data, sections: sections.data ?? [] };
    },
  });

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="State charter"
        title="Governance"
        description="The rules the state agrees to play by. Draft revisions are prepared privately and appear here once published."
      />
      <Section>
        {q.isLoading ? (
          <LoadingRows rows={5} />
        ) : q.isError ? (
          <ErrorNote />
        ) : !q.data ? (
          <EmptyState description="No governance document has been published for State 3496 yet." />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-wrap gap-2">
                <Tag tone="steel">Version {q.data.doc.version}</Tag>
                <Tag tone="muted">Effective {formatUtcDate(q.data.doc.effective_date)}</Tag>
              </div>
              <p className="label-mono mt-4">Last revised</p>
              <p className="data-mono text-sm">{formatUtcDate(q.data.doc.revised_date)}</p>
              <nav className="mt-6 border-t border-border pt-4" aria-label="Contents">
                <p className="label-mono mb-2">Contents</p>
                <ol className="space-y-1 text-sm">
                  {q.data.sections.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.anchor}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <span className="data-mono mr-2 text-steel">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            <article>
              <h2 className="text-2xl font-semibold">{q.data.doc.title}</h2>
              {q.data.doc.summary ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {q.data.doc.summary}
                </p>
              ) : null}
              {q.data.sections.length === 0 ? (
                <div className="mt-6">
                  <EmptyState description="This document has no published sections yet." />
                </div>
              ) : (
                <div className="mt-8 space-y-10">
                  {q.data.sections.map((s, i) => (
                    <section key={s.id} id={s.anchor} className="scroll-mt-24 border-t border-border pt-6">
                      <p className="label-mono">Section {String(i + 1).padStart(2, "0")}</p>
                      <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {s.body ?? "Information coming soon."}
                      </p>
                    </section>
                  ))}
                </div>
              )}
            </article>
          </div>
        )}
      </Section>
    </SiteLayout>
  );
}
