"use client";

import { useEffect, useState, useTransition } from "react";
import { confirmLeadWon } from "@/app/actions/leads";
import { PLAN_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type LeadPlan = Database["public"]["Enums"]["lead_plan"];

export function ConfirmWonDialog({
  leadId,
  plan,
  open,
  onCancel,
  onConfirmed,
}: {
  leadId: string;
  plan: LeadPlan | null;
  open: boolean;
  onCancel: () => void;
  onConfirmed: (plan: LeadPlan) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<LeadPlan | "">(plan ?? "");

  useEffect(() => {
    if (open) {
      setSelectedPlan(plan ?? "");
      setError(null);
    }
  }, [open, plan]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!selectedPlan) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmLeadWon(leadId, selectedPlan);
      if (result.success) onConfirmed(selectedPlan);
      else setError(result.error);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <div>
          <h3 className="font-display text-lg font-semibold text-brand-ink">Marcar como activado</h3>
          <p className="mt-1 text-sm text-slate-500">
            Al confirmar, este lead se marcará como <strong>Activado</strong> y{" "}
            <strong>Pagado</strong>. Selecciona el plan contratado.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-slate-400">Plan</span>
          <select
            value={selectedPlan}
            disabled={isPending}
            onChange={(e) => setSelectedPlan(e.target.value as LeadPlan)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
          >
            <option value="" disabled>
              Selecciona un plan...
            </option>
            {Object.entries(PLAN_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !selectedPlan}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Guardando..." : "Confirmar y marcar pagado"}
          </button>
        </div>
      </div>
    </div>
  );
}
