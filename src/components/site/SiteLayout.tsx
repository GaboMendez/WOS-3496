import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import type { StateSetting } from "../../../db/schema";

interface SiteLayoutProps {
  children: ReactNode;
  settings?: StateSetting | null;
}

export function SiteLayout({ children, settings }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader discordUrl={settings?.discordUrl} displayName={settings?.displayName} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
