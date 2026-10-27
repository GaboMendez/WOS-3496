import Link from "next/link";
import { AlertTriangle, Lock, RotateCcw } from "lucide-react";
import { getStateSettings, getTransferGuides } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, PageHeader, Section, SectionHeading } from "@/components/site/primitives";

export const metadata = {
  title: "Power Reduction Guide — State 3496",
  description: "Reversible and permanent power reduction steps before a state transfer.",
};

export default async function PowerGuidePage() {
  const [settings, guides] = await Promise.all([getStateSettings(), getTransferGuides()]);
  const categories = [
    { key: "reversible", label: "Reversible actions", icon: RotateCcw, description: "Power you can rebuild after the transfer." },
    { key: "permanent", label: "Permanent actions", icon: Lock, description: "Power or resources you will not get back." },
  ] as const;
  const general = guides.filter((guide) => guide.actionKind !== "reversible" && guide.actionKind !== "permanent");

  return <SiteLayout settings={settings}>
    <PageHeader eyebrow="Transfers" title="Power reduction guide" description="Read the risk note on every step before acting." />
    <Section>
      <Link href="/transfers" className="label-mono text-steel hover:underline">Back to transfer hub</Link>
      <div className="mt-6 flex gap-3 border-l-2 border-ember bg-ember/10 p-4 text-sm">
        <AlertTriangle className="size-4 shrink-0 text-ember" aria-hidden />
        <p>Caps, eligibility and dates change. Confirm current requirements in Discord before making permanent changes.</p>
      </div>
      {guides.length === 0 ? <EmptyState className="mt-8" description="No guidance has been published yet." /> :
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {categories.map(({ key, label, icon: Icon, description }) => <div key={key}>
            <SectionHeading title={label} description={description} />
            <ul className="space-y-4">
              {guides.filter((guide) => guide.actionKind === key).map((guide) => <li key={guide.id} className="surface border border-border p-4">
                <h3 className="flex items-center gap-2 font-display font-semibold"><Icon className="size-4 text-steel" aria-hidden />{guide.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{guide.body || "Information coming soon."}</p>
                {guide.riskNote && <p className="label-mono mt-3 text-ember">Risk · {guide.riskNote}</p>}
              </li>)}
            </ul>
          </div>)}
          {general.length > 0 && <div className="lg:col-span-2"><SectionHeading title="General guidance" description="Other published transfer advice." /><ul className="space-y-4">{general.map((guide) => <li key={guide.id} className="surface border border-border p-4"><h3 className="font-display font-semibold">{guide.title}</h3><p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{guide.body || "Information coming soon."}</p>{guide.riskNote && <p className="label-mono mt-3 text-ember">Risk · {guide.riskNote}</p>}</li>)}</ul></div>}
        </div>}
    </Section>
  </SiteLayout>;
}
