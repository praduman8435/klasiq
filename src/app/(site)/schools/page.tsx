import type { Metadata } from "next";
import { SchoolDirectory } from "@/components/school/school-directory";
import { STORE_CONTACT } from "@/lib/constants";
import { getActiveSchools } from "@/server/queries/schools";

export const metadata: Metadata = {
  title: "All schools",
  description: "Find your child's school and see its exact uniform, by class and size.",
  alternates: { canonical: "/schools" },
};

export default async function SchoolsPage() {
  const schools = await getActiveSchools();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Find your school</h1>
      <p className="mt-1 text-sm text-muted-foreground sm:text-base">
        Choose your school to see its exact uniform. School nahi mila? Call us on{" "}
        <a href={STORE_CONTACT.phoneHref} className="font-semibold text-primary underline-offset-2 hover:underline">
          {STORE_CONTACT.phone}
        </a>
        .
      </p>
      <SchoolDirectory schools={schools} />
    </div>
  );
}
