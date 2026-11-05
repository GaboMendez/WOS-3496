import { expect, test } from "bun:test";
import { groupSourceSections } from "../app/lib/wosguru/placement.ts";

test("all source sections have a destination and unknown sections remain visible", () => {
  const sections = [
    "state-profile", "aggregate-metrics", "peer-states", "power-distribution",
    "player-leaderboards", "furnace-details", "next-svs", "svs-details", "castle",
    "moves", "group", "future-source-section", "constructor",
  ].map((id) => ({ id, title: id, facts: [`fact ${id}`], tables: [] }));
  const groups = groupSourceSections(sections);
  expect(groups.overview.map((s) => s.id)).toEqual([
    "state-profile", "aggregate-metrics", "peer-states", "future-source-section", "constructor",
  ]);
  expect(groups.community.map((s) => s.id)).toEqual([
    "power-distribution", "player-leaderboards", "furnace-details",
  ]);
  expect(groups.svs.map((s) => s.id)).toEqual(["next-svs", "svs-details", "castle"]);
  expect(groups.transfers.map((s) => s.id)).toEqual(["moves", "group"]);
  expect(Object.values(groups).flat()).toHaveLength(sections.length);
  expect(groups.overview[3].facts).toEqual(["fact future-source-section"]);
});
