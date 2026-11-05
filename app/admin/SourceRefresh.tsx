"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = {
  status: string;
  lastSuccessAt: number | null;
  lastError: string | null;
  nextAllowedAt: number;
  players: number;
  alliances: number;
  nativeIssues?: string | null;
};

function parseIssues(value: string | null | undefined) {
  try {
    const parsed: unknown = value ? JSON.parse(value) : null;
    if (!parsed || typeof parsed !== "object") return null;
    const issue = parsed as { missingChiefIds?: unknown; unresolved?: unknown };
    return {
      missingChiefIds: typeof issue.missingChiefIds === "number" ? issue.missingChiefIds : 0,
      unresolved: Array.isArray(issue.unresolved) ? issue.unresolved.filter((value): value is string => typeof value === "string") : [],
    };
  } catch {
    return null;
  }
}

export function SourceRefresh() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const issues = parseIssues(status?.nativeIssues);

  async function load() {
    const response = await fetch("/api/admin/wosguru", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load refresh status.");
    setStatus(await response.json());
  }
  useEffect(() => {
    void load().catch(() => setMessage("Could not load refresh status."));
  }, []);

  async function refresh() {
    setBusy(true);
    setMessage("");
    try {
      for (let batch = 0; batch < 30; batch++) {
        const response = await fetch("/api/admin/wosguru", { method: "POST" });
        const result = await response.json();
        const progress = result.progress
          ? ` Roster ${result.progress.roster}/${result.progress.rosterTotal}; furnace ${result.progress.furnace}/${result.progress.furnaceTotal}.`
          : "";
        setMessage((result.message ?? result.error ?? "Refresh finished.") + progress);
        if (result.status !== "collecting") break;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, result.nextAllowedAt - Date.now() + 25)),
        );
        if (batch === 29) setMessage("Progress is saved. Select Refresh now to continue.");
      }
      await load();
    } catch {
      setMessage("Could not refresh state data. The last successful data is unchanged.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6" aria-label="State data refresh">
      <div className="surface flex flex-wrap items-center justify-between gap-4 border border-border p-4">
        <div>
          <h2 className="font-display text-lg font-semibold">State intelligence</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {status?.lastSuccessAt
              ? `Last refreshed ${new Date(status.lastSuccessAt).toLocaleString()} · ${status.alliances} alliances · ${status.players} player records`
              : "No successful refresh yet."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            New imports start at most once an hour. Page collection resumes automatically. Editorial
            records stay separate.
          </p>
          {status && status.nextAllowedAt > Date.now() && (
            <p className="mt-1 text-xs text-muted-foreground">
              Next refresh available {new Date(status.nextAllowedAt).toLocaleString()}.
            </p>
          )}
          {(message || status?.lastError) && (
            <p role="status" className="mt-2 text-sm text-steel">
              {message || status?.lastError}
            </p>
          )}
          {issues && (issues.missingChiefIds > 0 || issues.unresolved.length > 0) && (
            <div className="mt-3 text-sm text-ember" role="status">
              {issues.missingChiefIds > 0 && <p>{issues.missingChiefIds} player records lack a Chief ID and need identity review.</p>}
              {issues.unresolved.length > 0 && <p>Records needing review: {issues.unresolved.join(", ")}</p>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/#state-data" className="text-sm text-steel hover:underline">
            View data
          </Link>
          <button
            type="button"
            disabled={busy || status?.status === "unavailable"}
            onClick={() => void refresh()}
            className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Refreshing…" : "Refresh now"}
          </button>
        </div>
      </div>
    </section>
  );
}
