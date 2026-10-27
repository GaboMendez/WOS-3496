import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { resourceMetadata } from "@/lib/admin/resources";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AdminEditor } from "./AdminEditor";

export const metadata = { title: "Admin — State 3496", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isStaff) return <SiteLayout><div className="mx-auto max-w-3xl px-4 py-20">
    <h1 className="font-display text-3xl font-semibold">Access denied</h1>
    <p className="mt-3 text-muted-foreground">An editor or admin account is required.</p>
    <Link href="/auth" className="mt-5 inline-block text-steel hover:underline">Sign in</Link>
  </div></SiteLayout>;
  return <SiteLayout><AdminEditor resources={resourceMetadata().filter((resource) => !resource.adminOnly || user.isAdmin)} isAdmin={user.isAdmin} email={user.email || ""} /></SiteLayout>;
}
