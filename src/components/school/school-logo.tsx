import { cn } from "@/lib/utils";

function initials(name: string): string {
  const words = name.replace(/^Demo\s+/i, "").split(" ").filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export function SchoolLogo({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${name} logo placeholder`}
      className={cn(
        "flex items-center justify-center rounded-2xl bg-primary font-heading font-semibold text-primary-foreground",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
