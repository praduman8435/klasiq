import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ENQUIRY_STATUS_BADGE, ENQUIRY_STATUS_LABEL, type EnquiryStatus } from "@/lib/school-enquiry-status";
import { cn } from "@/lib/utils";
import { getSchoolEnquiries } from "@/server/queries/uniform-samples";

export const metadata: Metadata = { title: "School enquiries" };

const DATE = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && status in ENQUIRY_STATUS_LABEL ? (status as EnquiryStatus) : undefined;
  const enquiries = await getSchoolEnquiries(filter);

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-heading text-xl font-semibold tracking-tight">School enquiries</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Quote requests sent from the uniform designer at /for-schools.</p>
      </div>
      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1.5">
        {[undefined, ...(Object.keys(ENQUIRY_STATUS_LABEL) as EnquiryStatus[])].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/enquiries?status=${s}` : "/admin/enquiries"}
            aria-current={filter === s ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
            )}
          >
            {s ? ENQUIRY_STATUS_LABEL[s] : "All"}
          </Link>
        ))}
      </nav>
      {enquiries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No enquiries {filter ? "with this status" : "yet"}. Share {"/for-schools"} with principals and school managers.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {enquiries.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{e.schoolName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.contactName}
                    {e.role ? ` (${e.role})` : ""} · {e.phone}
                    {e.studentCount ? ` · ${e.studentCount} students` : ""}
                    {e.schoolType ? ` · ${e.schoolType === "NEW" ? "new school" : "running school"}` : ""}
                    {e.distanceMeters !== null ? ` · ${(e.distanceMeters / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} km` : ""}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{DATE.format(e.createdAt)}</span>
                <Badge variant="outline" className={ENQUIRY_STATUS_BADGE[e.status]}>
                  {ENQUIRY_STATUS_LABEL[e.status]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
