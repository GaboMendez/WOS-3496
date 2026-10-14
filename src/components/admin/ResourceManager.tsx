import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LoadingRows, EmptyState, ErrorNote } from "@/components/site/primitives";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "date" | "datetime" | "numbers";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
};

export type ResourceConfig = {
  table: string;
  title: string;
  description?: string;
  fields: Field[];
  listColumns: string[];
  orderBy?: { column: string; ascending?: boolean };
  parentColumn?: string;
  canDelete?: boolean;
};

type Row = Record<string, unknown>;

export function ResourceManager({
  config,
  parentId,
}: {
  config: ResourceConfig;
  parentId?: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const key = ["admin", config.table, parentId ?? "all"];

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      let query = supabase.from(config.table as never).select("*");
      if (config.parentColumn && parentId) {
        query = query.eq(config.parentColumn, parentId);
      }
      const order = config.orderBy ?? { column: "created_at", ascending: false };
      const { data, error } = await query.order(order.column, {
        ascending: order.ascending ?? true,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const payload: Row = { ...row };
      delete payload["created_at"];
      delete payload["updated_at"];
      const id = payload["id"] as string | undefined;
      delete payload["id"];
      if (config.parentColumn && parentId) payload[config.parentColumn] = parentId;

      if (id) {
        const { error } = await supabase
          .from(config.table as never)
          .update(payload as never)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(config.table as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(config.table as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function blankRow(): Row {
    const row: Row = {};
    for (const f of config.fields) {
      row[f.name] = f.type === "boolean" ? false : f.type === "numbers" ? [] : "";
    }
    return row;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{config.title}</h2>
          {config.description ? (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setEditing(blankRow())}
          className="inline-flex items-center gap-2 rounded-xs bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden /> New
        </button>
      </div>

      {list.isLoading ? (
        <LoadingRows rows={3} />
      ) : list.isError ? (
        <ErrorNote message={(list.error as Error).message} />
      ) : (list.data ?? []).length === 0 ? (
        <EmptyState title="No records" description="Nothing has been created here yet." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {config.listColumns.map((c) => (
                  <th key={c} className="label-mono px-3 py-2 font-normal">
                    {c.replace(/_/g, " ")}
                  </th>
                ))}
                <th className="label-mono px-3 py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).map((row) => (
                <tr key={String(row["id"])} className="border-b border-border last:border-0">
                  {config.listColumns.map((c) => (
                    <td key={c} className="px-3 py-2">
                      {formatCell(row[c])}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="label-mono text-steel hover:underline"
                      >
                        Edit
                      </button>
                      {config.canDelete === false ? null : (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Delete this record permanently?"))
                              remove.mutate(String(row["id"]));
                          }}
                          className="label-mono inline-flex items-center gap-1 text-destructive hover:underline"
                        >
                          <Trash2 className="size-3" aria-hidden /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <RecordForm
          fields={config.fields}
          row={editing}
          saving={save.isPending}
          onCancel={() => setEditing(null)}
          onSave={(row) => save.mutate(row)}
        />
      ) : null}
    </div>
  );
}

function formatCell(value: unknown) {
  if (value == null || value === "") return <span className="text-muted-foreground">—</span>;
  if (typeof value === "boolean")
    return <span className="data-mono">{value ? "yes" : "no"}</span>;
  if (Array.isArray(value)) return <span className="data-mono">{value.join(", ")}</span>;
  const s = String(value);
  return <span>{s.length > 60 ? `${s.slice(0, 60)}…` : s}</span>;
}

export function RecordForm({
  fields,
  row,
  saving,
  onCancel,
  onSave,
}: {
  fields: Field[];
  row: Row;
  saving: boolean;
  onCancel: () => void;
  onSave: (row: Row) => void;
}) {
  const [draft, setDraft] = useState<Row>({ ...row });

  function set(name: string, value: unknown) {
    setDraft((d) => ({ ...d, [name]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[oklch(0.19_0.017_252/0.6)] p-4">
      <form
        className="surface my-8 w-full max-w-2xl p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const clean: Row = { ...draft };
          for (const f of fields) {
            const v = clean[f.name];
            if (f.type === "number") clean[f.name] = v === "" || v == null ? null : Number(v);
            if ((f.type === "date" || f.type === "datetime") && v === "") clean[f.name] = null;
            if (f.type === "numbers") {
              clean[f.name] = Array.isArray(v)
                ? v
                : String(v ?? "")
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter((n) => Number.isFinite(n));
            }
          }
          onSave(clean);
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-lg font-semibold">
            {row["id"] ? "Edit record" : "New record"}
          </p>
          <button type="button" onClick={onCancel} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label
              key={f.name}
              className={f.type === "textarea" ? "block sm:col-span-2" : "block"}
            >
              <span className="label-mono mb-1 block">{f.label}</span>
              {f.type === "textarea" ? (
                <textarea
                  rows={5}
                  value={String(draft[f.name] ?? "")}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="w-full rounded-xs border border-input bg-background px-3 py-2 text-sm"
                />
              ) : f.type === "boolean" ? (
                <input
                  type="checkbox"
                  checked={Boolean(draft[f.name])}
                  onChange={(e) => set(f.name, e.target.checked)}
                  className="size-4"
                />
              ) : f.type === "numbers" ? (
                <input
                  value={
                    Array.isArray(draft[f.name])
                      ? (draft[f.name] as number[]).join(", ")
                      : String(draft[f.name] ?? "")
                  }
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder="3496, 1204, 88"
                  className="w-full rounded-xs border border-input bg-background px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type={
                    f.type === "number"
                      ? "number"
                      : f.type === "date"
                        ? "date"
                        : f.type === "datetime"
                          ? "datetime-local"
                          : "text"
                  }
                  value={toInputValue(draft[f.name], f.type)}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="w-full rounded-xs border border-input bg-background px-3 py-2 text-sm"
                />
              )}
              {f.help ? <span className="mt-1 block text-xs text-muted-foreground">{f.help}</span> : null}
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xs border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function toInputValue(value: unknown, type: FieldType) {
  if (value == null) return "";
  if (type === "datetime") {
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  }
  if (type === "date") return String(value).slice(0, 10);
  return String(value);
}
