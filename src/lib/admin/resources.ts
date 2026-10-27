import "server-only";
import { getTableColumns } from "drizzle-orm";
import type { AnySQLiteTable } from "drizzle-orm/sqlite-core";
import * as schema from "@/db/schema";

export const resources = {
  state_settings: { label: "State settings", table: schema.stateSettings, adminOnly: true },
  announcements: { label: "Announcements", table: schema.announcements },
  alliances: { label: "Alliances", table: schema.alliances },
  alliance_leaders: { label: "Alliance leaders", table: schema.allianceLeaders },
  alliance_events: { label: "Alliance events", table: schema.allianceEvents },
  governance_documents: { label: "Governance documents", table: schema.governanceDocuments },
  governance_sections: { label: "Governance sections", table: schema.governanceSections },
  transfer_windows: { label: "Transfer windows", table: schema.transferWindows },
  transfer_groups: { label: "Transfer groups", table: schema.transferGroups },
  transfer_guides: { label: "Power reduction guidance", table: schema.transferGuides },
  timeline_events: { label: "Timeline entries", table: schema.timelineEvents },
  svs_cycles: { label: "SvS cycles", table: schema.svsCycles },
  svs_story_metrics: { label: "SvS story metrics", table: schema.svsStoryMetrics },
  state_stories: { label: "State stories", table: schema.stateStories },
  operations_content: { label: "Operations content", table: schema.operationsContent },
  creators: { label: "Creators", table: schema.creators },
  media_assets: { label: "Media assets", table: schema.mediaAssets },
} as const;

export type ResourceName = keyof typeof resources;

export function getResource(name: string): { label: string; table: AnySQLiteTable; adminOnly?: boolean } | null {
  return name in resources ? resources[name as ResourceName] : null;
}

export function resourceMetadata() {
  return Object.entries(resources).map(([name, resource]) => ({
    name,
    label: resource.label,
    adminOnly: "adminOnly" in resource && resource.adminOnly,
    fields: Object.entries(getTableColumns(resource.table)).filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key)).map(([key, column]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
      kind: column.dataType === "boolean" ? "boolean" : column.dataType === "number" ? "number" : key === "states" || key === "socialLinks" ? "json" : key.endsWith("Date") || key.endsWith("At") ? "date" : "text",
      required: column.notNull && !column.hasDefault,
    })),
  }));
}
