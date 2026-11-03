"use client";

import Link from "next/link";
import { formatUtcDateTime } from "../../lib/state";
import type { StateSetting } from "../../../db/schema";

interface SiteFooterProps {
  settings?: StateSetting | null;
}

export function SiteFooter({ settings }: SiteFooterProps) {
  const socials = settings?.socialLinks
    ? typeof settings.socialLinks === "string"
      ? (JSON.parse(settings.socialLinks) as { label?: string; url?: string }[])
      : (settings.socialLinks as { label?: string; url?: string }[])
    : [];

  return (
    <footer className="mt-10 border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-base font-semibold">
            {settings?.displayName ?? "State 3496"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {settings?.tagline ?? "Community portal for the State 3496 player base."}
          </p>
          <p className="label-mono mt-4">
            Last updated {formatUtcDateTime(settings?.updatedAt ?? null)}
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-2 text-sm" aria-label="Footer">
          <Link href="/alliances" className="text-muted-foreground hover:text-foreground">
            Alliances
          </Link>
          <Link href="/governance" className="text-muted-foreground hover:text-foreground">
            Governance
          </Link>
          <Link href="/transfers" className="text-muted-foreground hover:text-foreground">
            Transfers
          </Link>
          <Link href="/timeline" className="text-muted-foreground hover:text-foreground">
            Timeline
          </Link>
          <Link href="/operations" className="text-muted-foreground hover:text-foreground">
            Operations
          </Link>
          <Link href="/svs" className="text-muted-foreground hover:text-foreground">
            SvS records
          </Link>
          <Link href="/community" className="text-muted-foreground hover:text-foreground">
            Community
          </Link>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            Admin
          </Link>
        </nav>

        <div>
          <p className="label-mono">Elsewhere</p>
          <ul className="mt-2 space-y-1 text-sm">
            {settings?.discordUrl ? (
              <li>
                <a
                  className="text-steel hover:underline"
                  href={settings.discordUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Discord
                </a>
              </li>
            ) : null}
            {socials.map((s, i) =>
              s?.url ? (
                <li key={i}>
                  <a
                    className="text-steel hover:underline"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {s.label ?? s.url}
                  </a>
                </li>
              ) : null,
            )}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            {settings?.disclaimer ??
              "Unofficial fan community. Not affiliated with the game publisher."}
          </p>
        </div>
      </div>
    </footer>
  );
}
