import { supabase } from "@/integrations/supabase/client";

export type StateSettings = {
  id: string;
  state_number: number;
  display_name: string;
  tagline: string | null;
  discord_url: string | null;
  launch_date: string | null;
  transfer_group: string | null;
  eligibility_range: string | null;
  recruiting_status: string | null;
  transfer_spots: number | null;
  power_cap_note: string | null;
  current_event: string | null;
  next_event_date: string | null;
  timezone: string;
  hero_generation: string | null;
  social_links: unknown;
  disclaimer: string;
  hero_image_url: string | null;
  updated_at: string;
};

export const stateSettingsQuery = {
  queryKey: ["state_settings"],
  queryFn: async (): Promise<StateSettings | null> => {
    const { data, error } = await supabase
      .from("state_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as StateSettings) ?? null;
  },
};

export function serverDay(launchDate: string | null | undefined): number | null {
  if (!launchDate) return null;
  const launch = Date.parse(`${launchDate}T00:00:00Z`);
  if (Number.isNaN(launch)) return null;
  return Math.floor((Date.now() - launch) / 86_400_000) + 1;
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
