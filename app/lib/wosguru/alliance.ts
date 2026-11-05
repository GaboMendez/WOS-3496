import type { WosguruSnapshot } from "./model";

// Tags are mutable source locators, not immutable IDs. Only staff-confirmed links
// are usable; duplicate source tags are ambiguous and must never be resolved.
export function linkedSourceAlliance(
  sourceAllianceTag: string | null,
  snapshot: WosguruSnapshot | null,
) {
  if (!sourceAllianceTag || !snapshot) return null;
  const matches = snapshot.alliances.filter((row) => row.tag === sourceAllianceTag);
  return matches.length === 1 ? matches[0] : null;
}
