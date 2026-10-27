"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Field = { key: string; label: string; kind: string; required: boolean };
type Resource = { name: string; label: string; adminOnly: boolean; fields: Field[] };
type Row = Record<string, unknown>;
type RoleRow = { id: string; email: string | null; displayName: string | null; role: string };

function inputValue(value: unknown) { return value == null ? "" : String(value); }
function summarize(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value);
  return text.length > 65 ? `${text.slice(0, 65)}…` : text;
}

export function AdminEditor({ resources, isAdmin, email }: { resources: Resource[]; isAdmin: boolean; email: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(resources[0]?.name || "");
  const [rows, setRows] = useState<Row[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const resource = resources.find((item) => item.name === selected);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(selected === "roles" ? "/api/admin/roles" : `/api/admin/${selected}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load records");
      if (selected === "roles") setRoles(data.rows); else setRows(data.rows);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load records"); }
    finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { if (selected) void load(); }, [load, selected]);

  async function save() {
    if (!resource || !editing) return;
    setSaving(true); setError("");
    try {
      const id = editing.id;
      const values = Object.fromEntries(resource.fields.map((field) => [field.key, editing[field.key] ?? (field.kind === "boolean" ? false : "")]));
      const response = await fetch(`/api/admin/${selected}`, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id, values } : values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save record");
      setEditing(null); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save record"); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this record?")) return;
    setError("");
    const response = await fetch(`/api/admin/${selected}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Could not delete record"); else { await load(); router.refresh(); }
  }

  async function updateRole(id: string, role: string) {
    setError("");
    const response = await fetch("/api/admin/roles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Could not change role"); else await load();
  }

  async function signOut() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/auth"); router.refresh(); }

  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div><p className="label-mono text-primary">Content administration</p><h1 className="mt-2 font-display text-3xl font-semibold">State 3496 admin</h1><p className="mt-2 text-sm text-muted-foreground">Signed in as {email}</p></div>
      <button className="border border-border px-4 py-2 text-sm hover:bg-accent" onClick={signOut}>Sign out</button>
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Admin resources" className="flex gap-1 overflow-x-auto lg:flex-col">
        {resources.map((item) => <button key={item.name} className={`shrink-0 px-3 py-2 text-left text-sm ${selected === item.name ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`} onClick={() => { setSelected(item.name); setEditing(null); }}>{item.label}</button>)}
        {isAdmin && <button className={`shrink-0 px-3 py-2 text-left text-sm ${selected === "roles" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`} onClick={() => { setSelected("roles"); setEditing(null); }}>User roles</button>}
      </nav>
      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">{selected === "roles" ? "User roles" : resource?.label}</h2>{resource && !(selected === "state_settings" && rows.length > 0) && <button className="bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" onClick={() => setEditing({})}>Add record</button>}</div>
        {error && <p role="alert" className="mb-4 border border-destructive/50 p-3 text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading records…</p> : selected === "roles" ?
          <div className="space-y-2">{roles.map((person) => <div key={person.id} className="surface flex flex-wrap items-center justify-between gap-3 border border-border p-3"><span>{person.displayName || person.email || person.id}<span className="ml-2 text-xs text-muted-foreground">{person.email}</span></span><select aria-label={`Role for ${person.email}`} className="border border-input bg-background p-2 text-sm" value={person.role} onChange={(event) => void updateRole(person.id, event.target.value)}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div>)}</div> :
          <div className="space-y-2">{rows.length === 0 && <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">No records yet.</p>}{rows.map((row) => <div key={String(row.id)} className="surface flex flex-wrap items-center justify-between gap-4 border border-border p-4"><div className="min-w-0"><p className="font-medium">{summarize(row.title || row.name || row.displayName || row.tag || row.id)}</p><p className="mt-1 text-xs text-muted-foreground">{resource?.fields.slice(0, 3).map((field) => `${field.label}: ${summarize(row[field.key])}`).join(" · ")}</p></div><div className="flex gap-2"><button className="border border-border px-3 py-1 text-sm hover:bg-accent" onClick={() => setEditing(row)}>Edit</button>{selected !== "state_settings" && <button className="border border-destructive/40 px-3 py-1 text-sm text-destructive" onClick={() => void remove(String(row.id))}>Delete</button>}</div></div>)}</div>}
      </section>
    </div>
    {editing && resource && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`${editing.id ? "Edit" : "Add"} ${resource.label}`}><div className="surface mx-auto my-6 max-w-3xl border border-border p-6"><div className="mb-5 flex justify-between"><h2 className="font-display text-xl font-semibold">{editing.id ? "Edit" : "Add"} {resource.label}</h2><button onClick={() => setEditing(null)} aria-label="Close editor">✕</button></div><form onSubmit={(event) => { event.preventDefault(); void save(); }}><div className="grid gap-4 sm:grid-cols-2">{resource.fields.map((field) => <label key={field.key} className={`block ${field.kind === "json" || /body|description|note|summary|disclaimer/i.test(field.key) ? "sm:col-span-2" : ""}`}><span className="label-mono mb-1 block">{field.label}{field.required ? " *" : ""}</span>{field.kind === "boolean" ? <input type="checkbox" checked={Boolean(editing[field.key])} onChange={(event) => setEditing({ ...editing, [field.key]: event.target.checked })} /> : field.kind === "json" || /body|description|note|summary|disclaimer/i.test(field.key) ? <textarea className="w-full border border-input bg-background p-2 text-sm" rows={field.kind === "json" ? 2 : 4} value={inputValue(editing[field.key])} onChange={(event) => setEditing({ ...editing, [field.key]: event.target.value })} required={field.required} placeholder={field.kind === "json" ? "JSON array, e.g. [3496, 1204]" : undefined} /> : <input className="w-full border border-input bg-background p-2 text-sm" type={field.kind === "number" ? "number" : "text"} value={inputValue(editing[field.key])} onChange={(event) => setEditing({ ...editing, [field.key]: event.target.value })} required={field.required} />}</label>)}</div><div className="mt-6 flex justify-end gap-3"><button type="button" className="border border-border px-4 py-2" onClick={() => setEditing(null)}>Cancel</button><button disabled={saving} className="bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div></form></div></div>}
  </div>;
}
