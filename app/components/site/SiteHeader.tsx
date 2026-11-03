"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, MessageCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/alliances", label: "Alliances" },
  { href: "/governance", label: "Governance" },
  { href: "/transfers", label: "Transfers" },
  { href: "/timeline", label: "Timeline" },
  { href: "/operations", label: "Operations" },
  { href: "/svs", label: "SvS" },
  { href: "/community", label: "Community" },
] as const;

interface SiteHeaderProps {
  discordUrl?: string | null;
  displayName?: string | null;
}

export function SiteHeader({ discordUrl, displayName }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-primary/30 bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center bg-primary font-display text-sm font-bold text-black">
            3496
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-display text-sm font-bold text-primary">
              {displayName ?? "State 3496"}
            </span>
            <span className="label-mono hidden text-muted-foreground sm:inline">Community portal</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b-2 border-transparent px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {discordUrl ? (
            <a
              href={discordUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="hidden items-center gap-2 bg-primary px-3 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90 sm:inline-flex"
            >
              <MessageCircle className="size-3.5" aria-hidden />
              Discord
            </a>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lg:hidden border-primary/30 text-primary"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      <div className={cn("border-t border-primary/30 lg:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto grid w-full max-w-7xl gap-1 px-4 py-3 sm:px-6" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xs px-2 py-2 text-sm text-muted-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="rounded-xs px-2 py-2 text-sm text-muted-foreground"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
