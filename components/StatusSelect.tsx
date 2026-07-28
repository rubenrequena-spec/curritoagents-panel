"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "@/app/actions/leads";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import { ConfirmWonDialog } from "@/components/ConfirmWonDialog";
import type { Database } from "@/lib/database.types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];
type LeadPlan = Database["public"]["Enums"]["lead_plan"];

export function StatusSelect({
  leadId,
  status,
  plan,
  className,
}: {
  leadId: string;
  status: LeadStatus;
  plan?: LeadPlan | null;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(status);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <select
        value={current}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as LeadStatus;
          if (next === "ganado") {
            setConfirmOpen(true);
            return;
          }
          setCurrent(next);
          startTransition(async () => {
            await updateLeadStatus(leadId, next);
          });
        }}
        className={
          className ??
          "rounded-md border border-slate-200 bg-white text-xs px-2 py-1.5 text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
        }
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <ConfirmWonDialog
        leadId={leadId}
        plan={plan ?? null}
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirmed={() => {
          setCurrent("ganado");
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
