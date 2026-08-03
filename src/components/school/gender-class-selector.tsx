"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type SchoolClassOption = { id: string; name: string };

export function GenderClassSelector({
  schoolSlug,
  classes,
  selectedGender,
  selectedClassId,
}: {
  schoolSlug: string;
  classes: SchoolClassOption[];
  selectedGender: "BOYS" | "GIRLS";
  selectedClassId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(next: { gender?: string; classId?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.gender) params.set("gender", next.gender);
    if ("classId" in next) {
      if (next.classId) {
        params.set("classId", next.classId);
      } else {
        params.delete("classId");
      }
    }
    router.push(`/school/${schoolSlug}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="tablist"
        aria-label="Uniform group"
        className="inline-flex rounded-full border bg-muted p-1"
      >
        {(["BOYS", "GIRLS"] as const).map((gender) => (
          <button
            key={gender}
            type="button"
            role="tab"
            aria-selected={selectedGender === gender}
            onClick={() => navigate({ gender })}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors",
              selectedGender === gender
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {gender === "BOYS" ? "Boys" : "Girls"}
          </button>
        ))}
      </div>

      {classes.length > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground">Class</span>
          <select
            value={selectedClassId ?? ""}
            onChange={(event) =>
              navigate({ classId: event.target.value || null })
            }
            className="h-9 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
