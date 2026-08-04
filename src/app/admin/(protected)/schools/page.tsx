import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAdminSchools } from "@/server/queries/admin/schools";

export const metadata: Metadata = { title: "Schools" };

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function AdminSchoolsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const schools = await getAdminSchools(q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Schools</h1>
          <p className="mt-1 text-sm text-muted-foreground">{schools.length} schools</p>
        </div>
        <Button render={<Link href="/admin/schools/new" />} nativeButton={false}
        >
          <Plus className="size-4" aria-hidden />
          Add School
        </Button>
      </div>

      <form>
        <Input name="q" placeholder="Search schools" defaultValue={q ?? ""} className="max-w-xs" />
      </form>

      {schools.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No schools found.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {schools.map((school) => (
            <li key={school.id}>
              <Link
                href={`/admin/schools/${school.id}`}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{school.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    /school/{school.slug} {school.city ? `· ${school.city}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!school.isActive && <Badge variant="outline">Inactive</Badge>}
                  {school.isVerifiedPartner && <Badge variant="secondary">Verified Partner</Badge>}
                  {school.isDemo && <Badge variant="outline">Demo</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {school._count.classes} classes &middot; {school._count.assignments} items &middot;{" "}
                    {school._count.orders} orders
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
