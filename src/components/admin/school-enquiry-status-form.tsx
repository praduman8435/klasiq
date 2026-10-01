"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ENQUIRY_STATUS_LABEL, type EnquiryStatus } from "@/lib/school-enquiry-status";
import { cn } from "@/lib/utils";
import { updateSchoolEnquiryAction } from "@/server/actions/admin/school-enquiries";

export function SchoolEnquiryStatusForm({ id, status, adminNote }: { id: string; status: EnquiryStatus; adminNote: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [note, setNote] = useState(adminNote);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold">Status</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Status">
        {(Object.keys(ENQUIRY_STATUS_LABEL) as EnquiryStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            onClick={() => setValue(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              value === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
            )}
          >
            {ENQUIRY_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Your note (only you see this)
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Quoted ₹1,150 per set for 400 students, call back Monday"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <Button
        type="button"
        className="h-9 w-fit"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await updateSchoolEnquiryAction({ id, status: value, adminNote: note });
            if (result.success) {
              toast.success("Enquiry updated.");
              router.refresh();
            } else toast.error(result.error.message);
          })
        }
      >
        {isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
