import { getStateSettings, getTransferGroups } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { RoutePlanner } from "./planner";

export const metadata = {
  title: "Transfer Route Planner — State 3496",
  description: "Find a recorded transfer path between two states.",
};

export default async function TransferRoutePage() {
  const [settings, groups] = await Promise.all([getStateSettings(), getTransferGroups()]);
  return <SiteLayout settings={settings}><RoutePlanner groups={groups} /></SiteLayout>;
}
