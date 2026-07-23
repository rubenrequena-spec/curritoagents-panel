"use client";

import { useTransition } from "react";
import { updateLeadPlanPaid } from "@/app/actions/leads";
import { PLAN_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type LeadPlan = Database["public"]["Enums"]["lead_plan"];

export function PlanPaidForm({
  leadId,
  plan,
  paid,
}: {
  leadId: string;
  plan: LeadPlan | null;
  paid: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <div className="text-sm text-slate-500">Plan / pagado</div>
      <div className="flex gap-3 items-center">
        <select
          defaultValue={plan ?? ""}
          disabled={isPending}
          onChange={(e) =>
            startTransition(() =>
              updateLeadPlanPaid(leadId, (e.target.value || null) as LeadPlan | null, paid),
            )
          }
          className="rounded-md bg-slate-800 border border-slate-700 text-xs px-2 py-1 disabled:opacity-50"
        >
          <option value="">Sin plan</option>
          {Object.entries(PLAN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-300">
          <input
            type="checkbox"
            defaultChecked={paid}
            disabled={isPending}
            onChange={(e) =>
              startTransition(() => updateLeadPlanPaid(leadId, plan, e.target.checked))
            }
          />
          Pagado
        </label>
      </div>
    </div>
  );
}
