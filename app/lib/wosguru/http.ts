export const MAX_HTML_BYTES = 1024 * 1024;
export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export class SourceError extends Error {
  constructor(
    message: string,
    readonly retryAt: number,
    readonly blocked = false,
  ) {
    super(message);
  }
}

export function retryAt(value: string | null, now: number): number {
  const seconds = value && /^\d+$/.test(value);
  const delay = seconds ? Number(value) * 1000 : value ? Date.parse(value) - now : HOUR;
  // Never shorten an upstream cooldown, even when it exceeds a day.
  const maximumTimestamp = 8_640_000_000_000_000;
  if (seconds && !Number.isFinite(delay)) return maximumTimestamp;
  return Math.min(maximumTimestamp, now + Math.max(60_000, Number.isFinite(delay) ? delay : HOUR));
}

// Match the most specific agent group and longest applicable path rule.
export function robotsAllowsState(text: string, path = "/state/3496"): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; pattern: string }[] }[] = [];
  let group: (typeof groups)[number] = { agents: [], rules: [] };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      if (group.rules.length) {
        groups.push(group);
        group = { agents: [], rules: [] };
      }
      group.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && value && group.agents.length) {
      group.rules.push({ allow: key === "allow", pattern: value });
    }
  }
  groups.push(group);
  const matches = groups.map((item) => ({
    ...item,
    specificity: Math.max(
      -1,
      ...item.agents.map((agent) =>
        agent === "wos3496portal" ? agent.length : agent === "*" ? 0 : -1,
      ),
    ),
  }));
  const specificity = Math.max(-1, ...matches.map((item) => item.specificity));
  let longest = -1;
  let allowed = true;
  for (const item of matches.filter(
    (item) => item.specificity === specificity && specificity >= 0,
  )) {
    for (const rule of item.rules) {
      const ends = rule.pattern.endsWith("$");
      const pattern = ends ? rule.pattern.slice(0, -1) : rule.pattern;
      const expression = pattern
        .split("*")
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*");
      if (!new RegExp(`^${expression}${ends ? "$" : ""}`).test(path)) continue;
      if (pattern.length > longest || (pattern.length === longest && rule.allow)) {
        longest = pattern.length;
        allowed = rule.allow;
      }
    }
  }
  return allowed;
}

export async function fetchText(
  url: string,
  fetcher: typeof fetch,
  now: number,
  limit = MAX_HTML_BYTES,
  format: "text" | "json" = "text",
): Promise<string> {
  const response = await fetcher(url, {
    headers: {
      "User-Agent": "WOS3496Portal/1.0 (+https://state3496.vercel.app)",
      Accept: format === "json" ? "application/json" : "text/html,text/plain;q=0.9",
    },
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    const blocked = response.status === 401 || response.status === 403;
    throw new SourceError(
      `Source returned HTTP ${response.status}`,
      response.status === 429
        ? retryAt(response.headers.get("retry-after"), now)
        : now + (blocked ? DAY : HOUR),
      blocked,
    );
  }
  const type = response.headers.get("content-type") ?? "";
  if (
    !(format === "json" ? /^application\/json(?:;|$)/i : /^(text\/html|text\/plain)(?:;|$)/i).test(
      type,
    ) ||
    Number(response.headers.get("content-length")) > limit
  ) {
    await response.body?.cancel();
    throw new SourceError("Unexpected source response type or size", now + HOUR);
  }
  if (!response.body) throw new SourceError("Empty source response", now + HOUR);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new SourceError("Source response exceeded the size limit", now + HOUR);
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const decoder = new TextDecoder();
  return chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join("") + decoder.decode();
}
