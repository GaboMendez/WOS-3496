import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, MessageCircle } from "lucide-react";
import { stateSettingsQuery } from "@/lib/state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/alliances", label: "Alliances" },
  { to: "/governance", label: "Governance" },
  { to: "/transfers", label: "Transfers" },
  { to: "/timeline", label: "Timeline" },
  { to: "/operations", label: "Operations" },
  { to: "/svs", label: "SvS" },
  { to: "/community", label: "Community" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data: settings } = useQuery(stateSettingsQuery);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center bg-primary font-display text-sm font-bold text-primary-foreground">3496</span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-display text-sm font-bold">{settings?.display_name ?? "State 3496"}</span>
            <span className="label-mono hidden sm:inline">Community portal</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
               className="border-b-2 border-transparent px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
               activeProps={{ className: "text-primary font-medium border-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {settings?.discord_url ? (
            <a
              href={settings.discord_url}
              target="_blank"
              rel="noreferrer noopener"
              className="hidden items-center gap-2 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
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
            className="lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      <div className={cn("border-t border-border lg:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto grid w-full max-w-7xl gap-1 px-4 py-3 sm:px-6" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-xs px-2 py-2 text-sm text-muted-foreground"
              activeProps={{ className: "text-primary font-medium bg-accent" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/admin"
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

export function CloseIcon() {
  return <X className="size-4" />;
}
