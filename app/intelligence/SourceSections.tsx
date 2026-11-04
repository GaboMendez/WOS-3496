import type { SourceSection } from "@/lib/wosguru/model";
import { Section, SectionHeading } from "@/components/site/primitives";

export function SourceSections({ sections }: { sections: SourceSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <Section key={section.id}>
          <div id={`source-${section.id}`} className="scroll-mt-24">
            <SectionHeading title={section.title} />
            {section.facts.length > 0 && (
              <div className="mb-5 space-y-2 text-sm text-muted-foreground">
                {section.facts.map((fact, index) => (
                  <p key={index}>{fact}</p>
                ))}
              </div>
            )}
            <div className="space-y-4">
              {section.tables.map((table, index) => (
                <details
                  key={index}
                  open={section.tables.length < 4}
                  className="surface border border-border"
                >
                  <summary className="cursor-pointer px-4 py-3 font-display text-sm font-semibold text-foreground">
                    {table.title}{" "}
                    <span className="ml-2 font-sans font-normal text-muted-foreground">
                      ({table.rows.length})
                    </span>
                  </summary>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-y border-border text-left">
                          {table.columns.map((column) => (
                            <th
                              key={column}
                              className="label-mono whitespace-nowrap px-4 py-3 font-normal"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {table.columns.map((_, columnIndex) => (
                              <td key={columnIndex} className="px-4 py-3 align-middle">
                                {row[columnIndex] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Section>
      ))}
    </>
  );
}
