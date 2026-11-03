import type { StateSetting } from "@/db/schema";

export type { StateSetting };

export function calculateServerDay(launchDate: string | null | undefined): number | null {
  if (!launchDate) return null;
  const launch = Date.parse(`${launchDate}T00:00:00Z`);
  if (Number.isNaN(launch)) return null;
  return Math.floor((Date.now() - launch) / 86_400_000) + 1;
}

export function serverDay(launchDate: string | null | undefined): number | null {
  return calculateServerDay(launchDate);
}

export function formatPower(value: number | null | undefined): string {
  if (value == null || value === 0) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function formatUtcDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatUtcDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;
}

/** Converts an "HH:MM" UTC time to the viewer's local time string. */
export function utcTimeToLocal(utcTime: string | null | undefined): string | null {
  if (!utcTime) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(utcTime.trim());
  if (!match) return null;
  const now = new Date();
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      Number(match[1]),
      Number(match[2]),
    ),
  );
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
