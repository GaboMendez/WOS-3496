"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import type { TransferGroup } from "@/db/schema";
import { EmptyState, PageHeader, Section, Tag } from "@/components/site/primitives";

type Group = Omit<TransferGroup, "states"> & { states: number[] };
type Hop = { from: number; to: number; group: Group };

function parseGroups(groups: TransferGroup[]): Group[] {
  return groups.map((group) => {
    let states: unknown = [];
    try { states = JSON.parse(group.states || "[]"); } catch { /* Invalid datasets stay empty. */ }
    return { ...group, states: Array.isArray(states) ? states.filter((value): value is number => Number.isInteger(value) && value > 0) : [] };
  });
}

function findRoute(groups: Group[], from: number, to: number): Hop[] {
  if (from === to) return [];
  const queue = [from];
  const seen = new Set([from]);
  const previous = new Map<number, Hop>();
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const group of groups) {
      if (!group.states.includes(current)) continue;
      for (const next of group.states) {
        if (seen.has(next)) continue;
        seen.add(next);
        previous.set(next, { from: current, to: next, group });
        if (next === to) {
          const route: Hop[] = [];
          for (let cursor = to; cursor !== from;) {
            const hop = previous.get(cursor);
            if (!hop) return [];
            route.unshift(hop);
            cursor = hop.from;
          }
          return route;
        }
        queue.push(next);
      }
    }
  }
  return [];
}

export function RoutePlanner({ groups: source }: { groups: TransferGroup[] }) {
  const groups = useMemo(() => parseGroups(source), [source]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("3496");
  const [submitted, setSubmitted] = useState<{ from: number; to: number } | null>(null);
  const route = submitted ? findRoute(groups, submitted.from, submitted.to) : null;

  return <>
    <PageHeader eyebrow="Transfers" title="Route planner" description="Find the shortest path using transfer groups recorded by the State 3496 team." />
    <Section>
      <Link href="/transfers" className="label-mono text-steel hover:underline">Back to transfer hub</Link>
      <form className="surface mt-6 grid gap-4 border border-border p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(event) => {
        event.preventDefault();
        const start = Number(from), end = Number(to);
        if (Number.isInteger(start) && Number.isInteger(end) && start > 0 && end > 0) setSubmitted({ from: start, to: end });
      }}>
        <label className="block"><span className="label-mono mb-1 block">From state</span><input className="w-full border border-input bg-background px-3 py-2" inputMode="numeric" pattern="[0-9]+" value={from} onChange={(event) => setFrom(event.target.value)} required /></label>
        <label className="block"><span className="label-mono mb-1 block">To state</span><input className="w-full border border-input bg-background px-3 py-2" inputMode="numeric" pattern="[0-9]+" value={to} onChange={(event) => setTo(event.target.value)} required /></label>
        <button className="bg-primary px-4 py-2 font-medium text-primary-foreground">Find route</button>
      </form>
      {groups.length === 0 ? <EmptyState className="mt-8" description="No transfer group datasets have been published yet." /> : null}
      {submitted && route ? <div className="mt-8">
        {route.length ? <>
          <p className="mb-4 flex gap-2 border-l-2 border-gold bg-gold/10 p-4 text-sm"><AlertTriangle className="size-4 shrink-0" aria-hidden />Confirm each hop, date and power cap before moving.</p>
          <ol className="space-y-3">{route.map((hop, index) => <li key={`${hop.from}-${hop.to}`} className="surface flex flex-wrap items-center gap-3 border border-border p-4">
            <span className="data-mono">Hop {index + 1}: {hop.from} <ArrowRight className="inline size-3" aria-hidden /> {hop.to}</span>
            <Tag>{hop.group.name}</Tag>{hop.group.windowLabel && <Tag tone="muted">{hop.group.windowLabel}</Tag>}
            {hop.group.notes && <span className="w-full text-sm text-muted-foreground">{hop.group.notes}</span>}
          </li>)}</ol>
        </> : <EmptyState title={submitted.from === submitted.to ? "Already at destination" : "No recorded route"} description={submitted.from === submitted.to ? "Start and destination are the same state." : `No published group connects state ${submitted.from} to state ${submitted.to}. A route may still exist in game.`} />}
      </div> : null}
      <h2 className="label-mono mb-3 mt-12">Published transfer groups</h2>
      <div className="surface overflow-x-auto border border-border"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr className="border-b border-border"><th className="p-3">Group</th><th className="p-3">Window</th><th className="p-3">States</th></tr></thead><tbody>{groups.map((group) => <tr key={group.id} className="border-b border-border last:border-0"><td className="p-3">{group.name}</td><td className="p-3">{group.windowLabel || "—"}</td><td className="data-mono p-3">{group.states.join(", ")}</td></tr>)}</tbody></table></div>
    </Section>
  </>;
}
