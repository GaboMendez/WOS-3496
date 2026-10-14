import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, LoadingRows, EmptyState, Tag } from "@/components/site/primitives";
import {
  ResourceManager,
  RecordForm,
  type Field,
  type ResourceConfig,
} from "@/components/admin/ResourceManager";
import { stateSettingsQuery } from "@/lib/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Admin — State 3496 Portal" },
      { name: "description", content: "Content administration for the State 3496 portal." },
      { property: "og:title", content: "Admin — State 3496 Portal" },
      { property: "og:description", content: "Content administration for the State 3496 portal." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const SETTINGS_FIELDS: Field[] = [
  { name: "state_number", label: "State number", type: "number" },
  { name: "display_name", label: "Display name", type: "text" },
  { name: "tagline", label: "Tagline", type: "text" },
  { name: "discord_url", label: "Discord invite URL", type: "text" },
  { name: "launch_date", label: "Launch date (server day origin)", type: "date" },
  { name: "transfer_group", label: "Transfer group", type: "text" },
  { name: "eligibility_range", label: "Eligibility range", type: "text" },
  { name: "recruiting_status", label: "Recruiting status", type: "text" },
  { name: "transfer_spots", label: "Available transfer spots", type: "number" },
  { name: "power_cap_note", label: "Power cap note", type: "textarea" },
  { name: "current_event", label: "Current event", type: "text" },
  { name: "next_event_date", label: "Next event date (UTC)", type: "datetime" },
  { name: "timezone", label: "Timezone label", type: "text" },
  { name: "hero_generation", label: "Hero generation / era", type: "text" },
  { name: "hero_image_url", label: "Hero image URL", type: "text" },
  { name: "disclaimer", label: "Community disclaimer", type: "textarea" },
];

const RESOURCES: Record<string, ResourceConfig> = {
  announcements: {
    table: "announcements",
    title: "Announcements",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "pinned", label: "Pinned", type: "boolean" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["title", "pinned", "published", "updated_at"],
  },
  alliances: {
    table: "alliances",
    title: "Alliances",
    description: "Slug is the public URL segment, e.g. frostwatch.",
    fields: [
      { name: "slug", label: "Slug", type: "text" },
      { name: "tag", label: "Tag", type: "text" },
      { name: "name", label: "Name", type: "text" },
      { name: "power", label: "Power", type: "number" },
      { name: "open_spots", label: "Open spots", type: "number" },
      { name: "recruiting_status", label: "Recruiting status", type: "text" },
      { name: "playstyle", label: "Playstyle", type: "text" },
      { name: "timezone_label", label: "Event timezone", type: "text" },
      { name: "hq_coordinates", label: "HQ coordinates", type: "text" },
      { name: "svs_contribution", label: "Expected SvS contribution", type: "text" },
      { name: "discord_url", label: "Discord contact URL", type: "text" },
      { name: "banner_url", label: "Banner image URL", type: "text" },
      { name: "short_description", label: "Short description", type: "text" },
      { name: "description", label: "Full description", type: "textarea" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["tag", "name", "power", "open_spots", "recruiting_status", "published"],
    orderBy: { column: "power", ascending: false },
  },
  governance_documents: {
    table: "governance_documents",
    title: "Governance documents",
    description: "Set status to published to make a document public.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "version", label: "Version", type: "text" },
      { name: "effective_date", label: "Effective date", type: "date" },
      { name: "revised_date", label: "Last revised", type: "date" },
      { name: "status", label: "Status (draft / published / archived)", type: "text" },
      { name: "summary", label: "Summary", type: "textarea" },
    ],
    listColumns: ["title", "version", "status", "updated_at"],
  },
  transfer_windows: {
    table: "transfer_windows",
    title: "Transfer windows",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "status", label: "Status (open / closed / upcoming)", type: "text" },
      { name: "phase", label: "Phase", type: "text" },
      {
        name: "transfer_type",
        label: "Type (ordinary / special / group / alliance)",
        type: "text",
      },
      { name: "starts_at", label: "Opens (UTC)", type: "datetime" },
      { name: "ends_at", label: "Closes (UTC)", type: "datetime" },
      { name: "eligibility_range", label: "Eligibility range", type: "text" },
      { name: "open_spots", label: "Open spots", type: "number" },
      { name: "power_cap_note", label: "Power cap note", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["name", "status", "transfer_type", "published"],
    orderBy: { column: "sort_order", ascending: true },
  },
  transfer_groups: {
    table: "transfer_groups",
    title: "Transfer groups",
    description: "States in the same group can transfer between each other; used by the planner.",
    fields: [
      { name: "name", label: "Group name", type: "text" },
      { name: "states", label: "State numbers (comma separated)", type: "numbers" },
      { name: "window_label", label: "Window label", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["name", "states", "window_label", "published"],
    orderBy: { column: "name", ascending: true },
  },
  transfer_guides: {
    table: "transfer_guides",
    title: "Power reduction guidance",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "action_kind", label: "Kind (reversible / permanent)", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "risk_note", label: "Risk note", type: "text" },
      { name: "sort_order", label: "Sort order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["title", "action_kind", "published"],
    orderBy: { column: "sort_order", ascending: true },
  },
  timeline_events: {
    table: "timeline_events",
    title: "Timeline entries",
    fields: [
      { name: "title", label: "Title", type: "text" },
      {
        name: "category",
        label: "Category (Heroes, Pets, Fire Crystal, Events, Systems, Sunfire, SvS, State History)",
        type: "text",
      },
      { name: "event_date", label: "Date", type: "date" },
      { name: "server_day", label: "Server day", type: "number" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "source_url", label: "Source link", type: "text" },
      { name: "image_url", label: "Image URL", type: "text" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["event_date", "category", "title", "published"],
    orderBy: { column: "event_date", ascending: true },
  },
  svs_cycles: {
    table: "svs_cycles",
    title: "SvS cycles",
    fields: [
      { name: "slug", label: "Slug", type: "text" },
      { name: "opponent", label: "Opponent", type: "text" },
      { name: "event_date", label: "Date", type: "date" },
      { name: "prep_result", label: "Prep result (win / loss / draw)", type: "text" },
      { name: "battle_result", label: "Battle result (win / loss / draw)", type: "text" },
      { name: "prep_score", label: "Our prep score", type: "number" },
      { name: "opponent_prep_score", label: "Opponent prep score", type: "number" },
      { name: "battle_score", label: "Our battle score", type: "number" },
      { name: "opponent_battle_score", label: "Opponent battle score", type: "number" },
      { name: "story_title", label: "Story title", type: "text" },
      { name: "story_intro", label: "Story intro", type: "textarea" },
      { name: "story_body", label: "Story body", type: "textarea" },
      { name: "image_url", label: "Image URL", type: "text" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["event_date", "opponent", "prep_result", "battle_result", "published"],
    orderBy: { column: "event_date", ascending: false },
  },
  state_stories: {
    table: "state_stories",
    title: "State stories",
    fields: [
      { name: "slug", label: "Slug", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "image_url", label: "Image URL", type: "text" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "published_at", label: "Published at", type: "datetime" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["title", "featured", "published", "published_at"],
  },
  operations_content: {
    table: "operations_content",
    title: "Operations content",
    description: "Section keys: roles, etiquette, rallies, comms.",
    fields: [
      { name: "section_key", label: "Section key", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["section_key", "title", "published"],
    orderBy: { column: "sort_order", ascending: true },
  },
  creators: {
    table: "creators",
    title: "Creators",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "platform", label: "Platform", type: "text" },
      { name: "handle", label: "Handle", type: "text" },
      { name: "content_type", label: "Content type", type: "text" },
      { name: "url", label: "Profile URL", type: "text" },
      { name: "avatar_url", label: "Avatar URL", type: "text" },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "sort_order", label: "Sort order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
    listColumns: ["name", "platform", "content_type", "published"],
    orderBy: { column: "sort_order", ascending: true },
  },
  media_assets: {
    table: "media_assets",
    title: "Media assets",
    description: "Track image URLs used across the portal.",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "url", label: "URL", type: "text" },
      { name: "kind", label: "Kind", type: "text" },
      { name: "storage_path", label: "Storage path", type: "text" },
    ],
    listColumns: ["name", "kind", "url"],
  },
};

const TABS = [
  { key: "settings", label: "State settings", adminOnly: true },
  { key: "announcements", label: "Announcements" },
  { key: "alliances", label: "Alliances" },
  { key: "governance", label: "Governance" },
  { key: "transfers", label: "Transfers" },
  { key: "timeline", label: "Timeline" },
  { key: "svs", label: "SvS" },
  { key: "stories", label: "Stories" },
  { key: "operations", label: "Operations" },
  { key: "creators", label: "Creators" },
  { key: "media", label: "Media" },
  { key: "roles", label: "Roles", adminOnly: true },
] as const;

function AdminPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const [tab, setTab] = useState<string>("alliances");

  if (loading) {
    return (
      <SiteLayout>
        <Section>
          <LoadingRows rows={3} />
        </Section>
      </SiteLayout>
    );
  }

  if (!user) {
    return (
      <SiteLayout>
        <Section className="max-w-lg">
          <h1 className="text-2xl font-semibold">Admin area</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an editor or admin account to manage portal content.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-block rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
        </Section>
      </SiteLayout>
    );
  }

  if (!isStaff) {
    return (
      <SiteLayout>
        <Section className="max-w-lg">
          <h1 className="text-2xl font-semibold">No editor access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({user.email}) does not have the editor or admin role yet. Ask a state
            admin to grant it.
          </p>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="mt-6 rounded-xs border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Sign out
          </button>
        </Section>
      </SiteLayout>
    );
  }

  const visibleTabs = TABS.filter((t) => !("adminOnly" in t && t.adminOnly) || isAdmin);

  return (
    <SiteLayout>
      <Section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="label-mono">Content administration</p>
            <h1 className="text-2xl font-semibold">State 3496 admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <Tag tone={isAdmin ? "gold" : "steel"}>{isAdmin ? "admin" : "editor"}</Tag>
            <span className="label-mono">{user.email}</span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-xs border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "label-mono rounded-xs border px-3 py-1.5",
                tab === t.key
                  ? "border-steel bg-steel text-steel-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "settings" && isAdmin ? <SettingsPanel /> : null}
          {tab === "announcements" ? <ResourceManager config={RESOURCES["announcements"]!} /> : null}
          {tab === "alliances" ? <AlliancePanel /> : null}
          {tab === "governance" ? <GovernancePanel /> : null}
          {tab === "transfers" ? (
            <div className="space-y-12">
              <ResourceManager config={RESOURCES["transfer_windows"]!} />
              <ResourceManager config={RESOURCES["transfer_groups"]!} />
              <ResourceManager config={RESOURCES["transfer_guides"]!} />
            </div>
          ) : null}
          {tab === "timeline" ? <ResourceManager config={RESOURCES["timeline_events"]!} /> : null}
          {tab === "svs" ? <SvsPanel /> : null}
          {tab === "stories" ? <ResourceManager config={RESOURCES["state_stories"]!} /> : null}
          {tab === "operations" ? (
            <ResourceManager config={RESOURCES["operations_content"]!} />
          ) : null}
          {tab === "creators" ? <ResourceManager config={RESOURCES["creators"]!} /> : null}
          {tab === "media" ? <ResourceManager config={RESOURCES["media_assets"]!} /> : null}
          {tab === "roles" && isAdmin ? <RolesPanel /> : null}
        </div>
      </Section>
    </SiteLayout>
  );
}

function SettingsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(stateSettingsQuery);
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const payload = { ...row };
      delete payload["id"];
      delete payload["updated_at"];
      delete payload["social_links"];
      const { error } = await supabase
        .from("state_settings")
        .update(payload as never)
        .eq("id", data!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("State settings updated");
      setOpen(false);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingRows rows={3} />;
  if (!data) return <EmptyState title="No settings row" />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-display text-xl font-semibold">State settings</h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xs bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Edit
        </button>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_FIELDS.map((f) => (
          <div key={f.name} className="border-l-2 border-steel/40 px-4 py-2">
            <dt className="label-mono">{f.label}</dt>
            <dd className="data-mono mt-1 text-sm">
              {String((data as Record<string, unknown>)[f.name] ?? "—")}
            </dd>
          </div>
        ))}
      </dl>
      {open ? (
        <RecordForm
          fields={SETTINGS_FIELDS}
          row={data as unknown as Record<string, unknown>}
          saving={save.isPending}
          onCancel={() => setOpen(false)}
          onSave={(row) => save.mutate(row)}
        />
      ) : null}
    </div>
  );
}

function AlliancePanel() {
  const [selected, setSelected] = useState<string>("");
  const alliances = useQuery({
    queryKey: ["admin", "alliances", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alliances").select("id, tag, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-12">
      <ResourceManager config={RESOURCES["alliances"]!} />

      <div>
        <label className="block max-w-sm">
          <span className="label-mono mb-1 block">Manage leaders and events for</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-xs border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select an alliance…</option>
            {(alliances.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                [{a.tag}] {a.name}
              </option>
            ))}
          </select>
        </label>

        {selected ? (
          <div className="mt-8 space-y-12">
            <ResourceManager
              parentId={selected}
              config={{
                table: "alliance_leaders",
                title: "Alliance leadership",
                parentColumn: "alliance_id",
                orderBy: { column: "sort_order", ascending: true },
                fields: [
                  { name: "name", label: "Name", type: "text" },
                  { name: "rank_title", label: "Rank (R5 / R4)", type: "text" },
                  { name: "discord_handle", label: "Discord handle", type: "text" },
                  { name: "sort_order", label: "Sort order", type: "number" },
                ],
                listColumns: ["name", "rank_title", "discord_handle"],
              }}
            />
            <ResourceManager
              parentId={selected}
              config={{
                table: "alliance_events",
                title: "Recurring events",
                description: "Times are stored and displayed in UTC (HH:MM).",
                parentColumn: "alliance_id",
                orderBy: { column: "sort_order", ascending: true },
                fields: [
                  { name: "name", label: "Event name", type: "text" },
                  { name: "utc_time", label: "UTC time (HH:MM)", type: "text" },
                  { name: "days", label: "Days", type: "text" },
                  { name: "notes", label: "Notes", type: "text" },
                  { name: "sort_order", label: "Sort order", type: "number" },
                ],
                listColumns: ["name", "utc_time", "days"],
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GovernancePanel() {
  const [selected, setSelected] = useState<string>("");
  const docs = useQuery({
    queryKey: ["admin", "governance_documents", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("governance_documents")
        .select("id, title, version, status")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-12">
      <ResourceManager config={RESOURCES["governance_documents"]!} />
      <div>
        <label className="block max-w-sm">
          <span className="label-mono mb-1 block">Edit sections of</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-xs border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a document…</option>
            {(docs.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} v{d.version} ({d.status})
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <div className="mt-8">
            <ResourceManager
              parentId={selected}
              config={{
                table: "governance_sections",
                title: "Document sections",
                parentColumn: "document_id",
                orderBy: { column: "sort_order", ascending: true },
                fields: [
                  { name: "anchor", label: "Anchor id", type: "text" },
                  { name: "title", label: "Title", type: "text" },
                  { name: "body", label: "Body", type: "textarea" },
                  { name: "sort_order", label: "Sort order", type: "number" },
                ],
                listColumns: ["sort_order", "title", "anchor"],
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SvsPanel() {
  const [selected, setSelected] = useState<string>("");
  const cycles = useQuery({
    queryKey: ["admin", "svs_cycles", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("svs_cycles")
        .select("id, opponent, event_date")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-12">
      <ResourceManager config={RESOURCES["svs_cycles"]!} />
      <div>
        <label className="block max-w-sm">
          <span className="label-mono mb-1 block">Add chart and contribution data to</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-xs border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a cycle…</option>
            {(cycles.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.event_date ?? "no date"} — {c.opponent}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <div className="mt-8">
            <ResourceManager
              parentId={selected}
              config={{
                table: "svs_story_metrics",
                title: "Score timeline and contributions",
                description:
                  "Kind 'timeline' feeds the line chart; kind 'contribution' feeds the alliance table.",
                parentColumn: "cycle_id",
                orderBy: { column: "sort_order", ascending: true },
                fields: [
                  { name: "label", label: "Label (time point or alliance)", type: "text" },
                  { name: "metric_kind", label: "Kind (timeline / contribution)", type: "text" },
                  { name: "our_value", label: "State 3496 value", type: "number" },
                  { name: "opponent_value", label: "Opponent value", type: "number" },
                  { name: "sort_order", label: "Sort order", type: "number" },
                ],
                listColumns: ["sort_order", "metric_kind", "label", "our_value", "opponent_value"],
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RolesPanel() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  const rows = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const [roles, profiles] = await Promise.all([
        supabase.from("user_roles").select("*"),
        supabase.from("profiles").select("*"),
      ]);
      if (roles.error) throw roles.error;
      return (roles.data ?? []).map((r) => ({
        ...r,
        email: (profiles.data ?? []).find((p) => p.id === r.user_id)?.email ?? r.user_id,
      }));
    },
  });

  const grant = useMutation({
    mutationFn: async () => {
      const { data: profile, error: perr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();
      if (perr) throw perr;
      if (!profile) throw new Error("No account found with that email. They must sign up first.");
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: profile.id, role: role as "admin" | "editor" | "viewer" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role granted");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role removed");
      qc.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h2 className="font-display text-xl font-semibold">Roles</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Editors can draft and publish content. Only admins can change state settings and roles.
      </p>

      <form
        className="surface mt-4 flex flex-wrap items-end gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          grant.mutate();
        }}
      >
        <label className="block">
          <span className="label-mono mb-1 block">Account email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xs border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="label-mono mb-1 block">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xs border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="editor">editor</option>
            <option value="admin">admin</option>
            <option value="viewer">viewer</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Grant
        </button>
      </form>

      <div className="surface mt-6 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="label-mono px-3 py-2 font-normal">Account</th>
              <th className="label-mono px-3 py-2 font-normal">Role</th>
              <th className="label-mono px-3 py-2 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows.data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">
                  <Tag tone={r.role === "admin" ? "gold" : "steel"}>{r.role}</Tag>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => revoke.mutate(r.id)}
                    className="label-mono text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
