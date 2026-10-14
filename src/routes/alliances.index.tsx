import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { formatPower, formatUtcDateTime } from "@/lib/state";

export const Route = createFileRoute("/alliances/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Alliance Directory — State 3496" },
      {
        name: "description",
        content:
          "Every alliance in State 3496 ranked by power, with open spots, recruiting status, playstyle and event timezone.",
      },
      { property: "og:title", content: "Alliance Directory — State 3496" },
      {
        property: "og:description",
        content: "Alliances of State 3496 ranked by power, with recruiting status and open spots.",
      },
    ],
  }),
  component: AlliancesPage,
});

function AlliancesPage() {
  const [recruiting, setRecruiting] = useState("all");
  const [playstyle, setPlaystyle] = useState("all");
  const [tz, setTz] = useState("all");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["alliances", "directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alliances")
        .select("*")
        .eq("published", true)
        .order("power", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = q.data ?? [];
  const options = useMemo(
    () => ({
      recruiting: unique(rows.map((r) => r.recruiting_status)),
      playstyle: unique(rows.map((r) => r.playstyle)),
      tz: unique(rows.map((r) => r.timezone_label)),
    }),
    [rows],
  );

  const filtered = rows.filter(
    (r) =>
      (recruiting === "all" || r.recruiting_status === recruiting) &&
      (playstyle === "all" || r.playstyle === playstyle) &&
      (tz === "all" || r.timezone_label === tz) &&
      (search.trim() === "" ||
        `${r.tag} ${r.name}`.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const totalPower = rows.reduce((s, r) => s + Number(r.power ?? 0), 0);
  const lastUpdated = rows
    .map((r) => r.updated_at)
    .sort()
    .at(-1);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Directory"
        title="State 3496 alliances"
        description="Alliances ranked by recorded power. Figures are supplied by alliance leadership and may lag in-game changes."
      />
      <Section>
        <div className="mb-6 flex flex-wrap items-end gap-6 border-b border-border pb-4">
          <div>
            <p className="label-mono">Total state power</p>
            <p className="data-mono text-xl font-medium">{formatPower(totalPower)}</p>
          </div>
          <div>
            <p className="label-mono">Numbers last updated</p>
            <p className="data-mono text-sm">{formatUtcDateTime(lastUpdated)}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Filter label="Search" >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tag or name"
              className="w-full rounded-xs border border-input bg-card px-3 py-2 text-sm"
            />
          </Filter>
          <Filter label="Recruiting">
            <Select value={recruiting} onChange={setRecruiting} options={options.recruiting} />
          </Filter>
          <Filter label="Playstyle">
            <Select value={playstyle} onChange={setPlaystyle} options={options.playstyle} />
          </Filter>
          <Filter label="Event timezone">
            <Select value={tz} onChange={setTz} options={options.tz} />
          </Filter>
        </div>

        {q.isLoading ? (
          <LoadingRows rows={5} />
        ) : q.isError ? (
          <ErrorNote />
        ) : filtered.length === 0 ? (
          <EmptyState description="No alliances match this view yet." />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="label-mono px-4 py-3 font-normal">#</th>
                  <th className="label-mono px-4 py-3 font-normal">Alliance</th>
                  <th className="label-mono px-4 py-3 font-normal">Power</th>
                  <th className="label-mono px-4 py-3 font-normal">Open spots</th>
                  <th className="label-mono px-4 py-3 font-normal">Recruiting</th>
                  <th className="label-mono px-4 py-3 font-normal">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="data-mono px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        to="/alliances/$slug"
                        params={{ slug: a.slug }}
                        className="font-medium hover:underline"
                      >
                        <span className="data-mono text-steel">[{a.tag}]</span> {a.name}
                      </Link>
                      {a.timezone_label ? (
                        <span className="label-mono ml-2">{a.timezone_label}</span>
                      ) : null}
                    </td>
                    <td className="data-mono px-4 py-3">{formatPower(Number(a.power))}</td>
                    <td className="data-mono px-4 py-3">{a.open_spots ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Tag tone={a.recruiting_status === "Open" ? "gold" : "muted"}>
                        {a.recruiting_status}
                      </Tag>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.short_description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </SiteLayout>
  );
}

function unique(values: (string | null)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-mono mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xs border border-input bg-card px-3 py-2 text-sm"
    >
      <option value="all">All</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
