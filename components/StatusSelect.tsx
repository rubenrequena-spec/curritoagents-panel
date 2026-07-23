"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/app/actions/leads";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

export function StatusSelect({
  leadId,
  status,
  className,
}: {
  leadId: string;
  status: LeadStatus;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => updateLeadStatus(leadId, e.target.value as LeadStatus))
      }
      className={
        className ??
        "rounded-md bg-slate-800 border border-slate-700 text-xs px-2 py-1 disabled:opacity-50"
      }
    >
      {STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
