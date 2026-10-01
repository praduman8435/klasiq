import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { SchoolEnquiryStatusForm } from "@/components/admin/school-enquiry-status-form";
import { UniformPreview, type ChosenParts } from "@/components/schools/uniform-preview";
import { normalizePhoneNumber } from "@/lib/phone";
import { ENQUIRY_STATUS_LABEL } from "@/lib/school-enquiry-status";
import { DESIGN_PARTS, SAMPLE_KIND_LABEL, type DesignSample } from "@/lib/uniform-design";
import { db } from "@/lib/db";
import { getSchoolEnquiryById } from "@/server/queries/uniform-samples";
import type { DesignSnapshot } from "@/server/actions/school-enquiry";

export const metadata: Metadata = { title: "School enquiry" };

const DATE = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export default async function AdminEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiry = await getSchoolEnquiryById(id);
  if (!enquiry) notFound();

  const snapshot = (enquiry.design ?? {}) as DesignSnapshot;
  const current = await db.uniformSample.findMany({
    where: { id: { in: Object.values(snapshot).map((s) => s!.id) } },
    select: { id: true, code: true, name: true, kind: true, pattern: true, colourHex: true, accentHex: true, photoUrl: true },
  });
  const byId = new Map<string, DesignSample>(current.map((s) => [s.id, s]));
  const parts: ChosenParts = {};
  for (const part of DESIGN_PARTS) {
    const chosen = snapshot[part.key];
    const sample = chosen ? byId.get(chosen.id) : undefined;
    if (sample) parts[part.key] = sample;
  }
  const phone = normalizePhoneNumber(enquiry.phone);
  const waNumber = phone.valid ? phone.normalized.replace("+", "") : null;

  const facts: [string, string | null][] = [
    ["Contact", `${enquiry.contactName}${enquiry.role ? ` (${enquiry.role})` : ""}`],
    ["Mobile", enquiry.phone],
    ["City / town", enquiry.city],
    ["Students", enquiry.studentCount ? String(enquiry.studentCount) : null],
    ["Classes", enquiry.classes],
    ["Needed by", enquiry.neededBy],
    ["Sent", DATE.format(enquiry.createdAt)],
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/enquiries" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All enquiries
      </Link>
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">{enquiry.schoolName}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {enquiry.enquiryNumber} · {ENQUIRY_STATUS_LABEL[enquiry.status]}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${enquiry.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
              <Phone className="size-4" aria-hidden />
              Call {enquiry.contactName}
            </a>
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp
              </a>
            )}
          </div>

          <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-2">
            {facts
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
          </dl>

          {enquiry.message && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="text-xs text-muted-foreground">Message</p>
              <p className="mt-1 whitespace-pre-line">{enquiry.message}</p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold">Chosen design</p>
            <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {DESIGN_PARTS.filter((part) => snapshot[part.key]).map((part) => (
                <li key={part.key}>
                  <span className="text-muted-foreground">{SAMPLE_KIND_LABEL[part.kind]}:</span> {snapshot[part.key]!.name}
                  {snapshot[part.key]!.code ? ` (${snapshot[part.key]!.code})` : ""}
                  {!byId.has(snapshot[part.key]!.id) && <span className="text-muted-foreground"> · sample since deleted</span>}
                </li>
              ))}
              {Object.keys(snapshot).length === 0 && <li className="text-muted-foreground">No samples chosen</li>}
            </ul>
          </div>

          <SchoolEnquiryStatusForm id={enquiry.id} status={enquiry.status} adminNote={enquiry.adminNote ?? ""} />
        </div>

        <div className="storefront self-start rounded-2xl border border-border bg-card p-4 text-foreground lg:sticky lg:top-6">
          <div className="h-96 rounded-xl bg-[radial-gradient(ellipse_at_50%_30%,oklch(0.32_0.02_260),oklch(0.16_0.02_260)_70%)] p-3">
            <UniformPreview parts={parts} idPrefix={`enq-${enquiry.id}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
