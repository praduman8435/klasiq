import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  href?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const content = (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 transition-colors",
        href && "hover:border-primary/40",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-heading text-2xl font-semibold",
          tone === "warning" && "text-amber-700 dark:text-amber-400",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
