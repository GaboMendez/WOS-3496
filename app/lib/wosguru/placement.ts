import type { SourceSection } from "./model";

export type SourceSectionDestination = "overview" | "community" | "svs" | "transfers";

// Source sections remain in the validated snapshot. This only chooses where to
// display them; it does not create identities or merge staff-managed records.
const destinationById: Record<string, SourceSectionDestination> = {
  "state-profile": "overview",
  "aggregate-metrics": "overview",
  "peer-states": "overview",
  "power-distribution": "community",
  "player-leaderboards": "community",
  "furnace-details": "community",
  "next-svs": "svs",
  "svs-details": "svs",
  castle: "svs",
  moves: "transfers",
  group: "transfers",
};

export function groupSourceSections(sections: SourceSection[]) {
  const groups: Record<SourceSectionDestination, SourceSection[]> = {
    overview: [],
    community: [],
    svs: [],
    transfers: [],
  };
  for (const section of sections) {
    const destination = Object.hasOwn(destinationById, section.id)
      ? destinationById[section.id]
      : "overview";
    groups[destination].push(section);
  }
  return groups;
}
