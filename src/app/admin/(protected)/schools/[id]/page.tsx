import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolForm } from "@/components/admin/school-form";
import { SchoolClassesManager } from "@/components/admin/school-classes-manager";
import { SchoolAssignmentsManager } from "@/components/admin/school-assignments-manager";
import { SchoolRecommendedSetsManager } from "@/components/admin/school-recommended-sets-manager";
import { getAdminSchoolById, getAssignableProductsForSchool } from "@/server/queries/admin/schools";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const school = await getAdminSchoolById(id);
  return { title: school?.name ?? "School" };
}

export default async function AdminSchoolDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [school, products] = await Promise.all([
    getAdminSchoolById(id),
    getAssignableProductsForSchool(id),
  ]);
  if (!school) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{school.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">/school/{school.slug}</p>
      </div>

      <section className="max-w-xl rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">School details</h2>
        <div className="mt-3">
          <SchoolForm
            initial={{
              id: school.id,
              name: school.name,
              slug: school.slug,
              city: school.city ?? "",
              logoUrl: school.logoUrl ?? "",
              isActive: school.isActive,
              isVerifiedPartner: school.isVerifiedPartner,
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Classes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Grades/classes this school uses — needed for class-specific uniform items and sets.
        </p>
        <div className="mt-3">
          <SchoolClassesManager schoolId={school.id} classes={school.classes} />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Uniform assignments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Which products this school&apos;s storefront shows, per class and gender group. Leave
          class as &quot;All Classes&quot; for items every student needs.
        </p>
        <div className="mt-3">
          <SchoolAssignmentsManager
            schoolId={school.id}
            assignments={school.assignments}
            classes={school.classes}
            products={products}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Recommended complete uniform sets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown to parents on the school storefront as a one-tap &quot;Add Complete Set.&quot;
        </p>
        <div className="mt-3">
          <SchoolRecommendedSetsManager
            schoolId={school.id}
            sets={school.recommendedSets}
            classes={school.classes}
            products={products}
          />
        </div>
      </section>
    </div>
  );
}
