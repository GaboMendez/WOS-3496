"use client";

import { useState } from "react";
import type { AllianceEvent } from "@/db/schema";
import { utcTimeToLocal } from "@/lib/state";

export function AllianceEvents({ events }: { events: AllianceEvent[] }) {
  const [local, setLocal] = useState(false);
  return <>
    <button type="button" className="label-mono mt-3 border border-border px-2 py-1 hover:bg-accent" aria-pressed={local} onClick={() => setLocal(!local)}>{local ? "Showing local time" : "Showing UTC"}</button>
    <div className="surface mt-4 overflow-x-auto border border-border"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr className="border-b border-border"><th className="p-3">Event</th><th className="p-3">Time</th><th className="p-3">Days</th><th className="p-3">Notes</th></tr></thead><tbody>{events.map((event) => <tr key={event.id} className="border-b border-border last:border-0"><td className="p-3 font-medium">{event.name}</td><td className="data-mono p-3">{local ? utcTimeToLocal(event.utcTime) || event.utcTime || "—" : event.utcTime ? `${event.utcTime} UTC` : "—"}</td><td className="p-3">{event.days || "—"}</td><td className="p-3 text-muted-foreground">{event.notes || "—"}</td></tr>)}</tbody></table></div>
  </>;
}
