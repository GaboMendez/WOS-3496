import Link from "next/link";
import { Shield } from "lucide-react";
import { getAlliances } from "@/lib/actions";
import { getStateSettings } from "@/lib/actions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeading, Tag } from "@/components/site/primitives";
import { formatPower } from "@/lib/state";

export default async function AlliancesPage() {
  const [settings, alliancesData] = await Promise.all([
    getStateSettings(),
    getAlliances(true),
  ]);

  return (
    <SiteLayout settings={settings}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Section>
          <SectionHeading
            eyebrow="Alliance Directory"
            title="Our Alliances"
            description="Join one of our state alliances and grow together."
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alliancesData.map((alliance) => (
              <Link
                key={alliance.id}
                href={`/alliances/${alliance.slug}`}
                className="group surface flex flex-col gap-3 border border-border p-5 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      [{alliance.tag}] {alliance.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {alliance.shortDescription}
                    </p>
                  </div>
                  <Shield className="size-5 text-muted-foreground" />
                </div>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Tag tone={alliance.recruitingStatus === "open" ? "green" : "muted"}>
                    {alliance.recruitingStatus}
                  </Tag>
                  <Tag tone="muted">{formatPower(alliance.power)}</Tag>
                  <Tag tone="muted">{alliance.openSpots} spots</Tag>
                </div>
              </Link>
            ))}
          </div>

          {alliancesData.length === 0 && (
            <p className="mt-4 text-center text-muted-foreground">
              No alliances found.
            </p>
          )}
        </Section>
      </div>
    </SiteLayout>
  );
}
