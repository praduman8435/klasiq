import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { SchoolLogo } from "@/components/school/school-logo";
import { GenderClassSelector } from "@/components/school/gender-class-selector";
import { RecommendedSetCard } from "@/components/school/recommended-set-card";
import { BRAND } from "@/lib/constants";
import {
  getSchoolAssignedProducts,
  getSchoolBySlug,
  getSchoolRecommendedSets,
} from "@/server/queries/schools";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ gender?: string; classId?: string }>;
};

function resolveGender(value: string | undefined): "BOYS" | "GIRLS" {
  return value === "GIRLS" ? "GIRLS" : "BOYS";
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const school = await getSchoolBySlug(slug);
  if (!school || !school.isActive) {
    return { title: "School Not Found" };
  }
  return {
    title: `${school.name} Uniforms`,
    description: `School uniform collection for ${school.name}. Find the right size, check availability and add to your bag.`,
    alternates: { canonical: `/school/${school.slug}` },
  };
}

export default async function SchoolStorefrontPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const school = await getSchoolBySlug(slug);
  if (!school || !school.isActive) {
    notFound();
  }

  const gender = resolveGender(query.gender);
  const classId =
    query.classId && school.classes.some((c) => c.id === query.classId)
      ? query.classId
      : null;

  const [products, recommendedSets] = await Promise.all([
    getSchoolAssignedProducts({ schoolId: school.id, classId, gender }),
    getSchoolRecommendedSets({ schoolId: school.id, classId, gender }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {school.isDemo && (
        <p className="mb-4 inline-flex rounded-full bg-accent/40 px-3 py-1 text-xs font-medium text-accent-foreground">
          Demo school — for illustration only, not a real {BRAND.name} partner.
        </p>
      )}

      <div className="flex items-center gap-4">
        <SchoolLogo name={school.name} className="size-16 shrink-0 text-xl sm:size-20 sm:text-2xl" />
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {school.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {school.city ? `${school.city} · ` : ""}
            {school.isVerifiedPartner
              ? "Official Uniform Partner"
              : "School Uniform Collection"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <GenderClassSelector
          schoolSlug={school.slug}
          classes={school.classes}
          selectedGender={gender}
          selectedClassId={classId}
        />
      </div>

      {recommendedSets.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {recommendedSets.map((set) => (
            <RecommendedSetCard key={set.id} set={set} />
          ))}
        </div>
      )}

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No uniform items are set up yet for this selection. Try the other
            gender tab, or browse{" "}
            <a href="/uniforms" className="underline underline-offset-2">
              generic uniform essentials
            </a>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categorySlug={product.category.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
