"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SvsStoryMetric } from "@/db/schema";

export function SvsMetrics({ metrics, opponent }: { metrics: SvsStoryMetric[]; opponent: string }) {
  const timeline = metrics.filter((metric) => metric.metricKind === "timeline").map((metric) => ({ label: metric.label, us: metric.ourValue, them: metric.opponentValue }));
  const contributions = metrics.filter((metric) => metric.metricKind === "contribution");
  return <>
    {timeline.length > 0 && <section className="mt-10"><h2 className="font-display text-xl font-semibold">Score timeline</h2><p className="label-mono mt-1">Values entered by the admin team</p><div className="surface mt-4 h-72 border border-border p-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={timeline}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" /><XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} /><Tooltip /><Line type="monotone" dataKey="us" name="State 3496" stroke="hsl(var(--steel))" strokeWidth={2} /><Line type="monotone" dataKey="them" name={opponent} stroke="hsl(var(--ember))" strokeWidth={2} /></LineChart></ResponsiveContainer></div></section>}
    {contributions.length > 0 && <section className="mt-10"><h2 className="font-display text-xl font-semibold">Alliance contributions</h2><div className="surface mt-4 overflow-x-auto border border-border"><table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="border-b border-border"><th className="p-3">Alliance</th><th className="p-3">Points</th></tr></thead><tbody>{contributions.map((metric) => <tr key={metric.id} className="border-b border-border last:border-0"><td className="p-3">{metric.label}</td><td className="data-mono p-3">{metric.ourValue?.toLocaleString() || "—"}</td></tr>)}</tbody></table></div></section>}
  </>;
}
