"use client";

import { useState, useTransition } from "react";
import { updateClientPlan } from "@/app/actions/clients";
import { PLAN_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type LeadPlan = Database["public"]["Enums"]["lead_plan"];

export function ChangePlanControl({
  clientId,
  leadId,
  plan,
}: {
  clientId: string;
  leadId: string;
  plan: LeadPlan | null;
}) {
  const [current, setCurrent] = useState(plan);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LeadPlan | "">(plan ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!selectedPlan) return;
    setError(null);
    startTransition(async () => {
      const result = await updateClientPlan(clientId, leadId, selectedPlan);
      if (result.success) {
        setCurrent(selectedPlan);
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600">{current ? PLAN_LABELS[current] : "Sin plan"}</span>
      <button
        type="button"
        onClick={() => {
          setSelectedPlan(current ?? "");
          setError(null);
          setOpen(true);
        }}
        className="text-xs font-medium text-brand-blue hover:underline"
      >
        Cambiar plan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-ink">Cambiar plan</h3>
              <p className="mt-1 text-sm text-slate-500">
                Actualiza el plan contratado. El precio y los ingresos del panel se recalculan
                automáticamente a partir de este plan.
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
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !selectedPlan || selectedPlan === current}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
