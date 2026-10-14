import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-3">
      <div className="max-w-2xl">
        {eyebrow ? <p className="label-mono mb-2">{eyebrow}</p> : null}
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <p className="label-mono">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DataPoint({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string | undefined;
}) {
  return (
    <div className="min-w-0 border-l-2 border-primary/60 bg-card px-4 py-3">
      <p className="label-mono">{label}</p>
      <p className="data-mono mt-1 text-lg font-medium text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title = "Information coming soon",
  description = "This data has not been supplied for State 3496 yet.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1 border border-dashed border-border bg-card p-6">
      <p className="label-mono">Awaiting data</p>
      <p className="font-display text-base font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded-sm bg-muted" />
      ))}
    </div>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  return (
    <div className="surface border-destructive/40 p-4 text-sm text-destructive">
      Could not load this data. {message ?? "Please try again shortly."}
    </div>
  );
}

export function Tag({
  children,
  tone = "steel",
}: {
  children: ReactNode;
  tone?: "steel" | "gold" | "ember" | "muted";
}) {
  const tones: Record<string, string> = {
    steel: "border-steel/40 text-steel",
    gold: "border-gold/60 text-gold-foreground bg-gold/15",
    ember: "border-ember/50 text-ember",
    muted: "border-border text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center rounded-xs border px-2 py-0.5 leading-5",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
