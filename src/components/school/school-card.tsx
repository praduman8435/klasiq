import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SchoolCrest } from "@/components/school/school-crest";

export type SchoolCardData = {
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  isDemo: boolean;
};

/** One school in a list: tap anywhere to see its uniform. */
export function SchoolCard({ school }: { school: SchoolCardData }) {
  return (
    <Link
      href={`/school/${school.slug}`}
      className="group flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-[0_8px_24px_-14px_oklch(0_0_0/0.6)]"
    >
      <SchoolCrest school={school} className="h-13 w-11" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold leading-5 group-hover:text-primary">{school.name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {school.isDemo ? "Demo school · sample items" : (school.city ?? "School uniform")}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
    </Link>
  );
}
