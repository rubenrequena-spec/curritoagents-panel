"use client";

import { useState, useTransition } from "react";
import { updateLeadStatusPlanPaid } from "@/app/actions/leads";
import { STATUS_LABELS, STATUS_ORDER, PLAN_LABELS } from "@/lib/constants";
import { ConfirmWonDialog } from "@/components/ConfirmWonDialog";
import { IconCheck } from "@/components/icons";
import type { Database } from "@/lib/database.types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];
type LeadPlan = Database["public"]["Enums"]["lead_plan"];

export function LeadStatusPlanForm({
  leadId,
  status,
  plan,
  paid,
}: {
  leadId: string;
  status: LeadStatus;
  plan: LeadPlan | null;
  paid: boolean;
}) {
  const [baseline, setBaseline] = useState({ status, plan, paid });
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftPlan, setDraftPlan] = useState(plan);
  const [draftPaid, setDraftPaid] = useState(paid);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty =
    draftStatus !== baseline.status || draftPlan !== baseline.plan || draftPaid !== baseline.paid;

  const markEdited = () => {
    setJustSaved(false);
    setSaveError(null);
  };

  const handleSave = () => {
    setSaveError(null);
    startSaving(async () => {
      const result = await updateLeadStatusPlanPaid(leadId, {
        status: draftStatus,
        plan: draftPlan,
        paid: draftPaid,
      });
      if (result.success) {
        setBaseline({ status: draftStatus, plan: draftPlan, paid: draftPaid });
        setJustSaved(true);
      } else {
        setSaveError(result.error);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-8">
        <div className="space-y-1.5">
          <div className="text-sm text-slate-500">Estado</div>
          <select
            value={draftStatus}
            disabled={isSaving}
            onChange={(e) => {
              const next = e.target.value as LeadStatus;
              if (next === "ganado") {
                setConfirmOpen(true);
                return;
              }
              markEdited();
              setDraftStatus(next);
            }}
            className="rounded-md border border-slate-200 bg-white text-xs px-2 py-1.5 text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-slate-500">Plan / pagado</div>
          <div className="flex gap-3 items-center">
            <select
              value={draftPlan ?? ""}
              disabled={isSaving}
              onChange={(e) => {
                markEdited();
                setDraftPlan((e.target.value || null) as LeadPlan | null);
              }}
              className="rounded-md border border-slate-200 bg-white text-xs px-2 py-1.5 text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
            >
              <option value="">Sin plan</option>
              {Object.entries(PLAN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={draftPaid}
                disabled={isSaving}
                onChange={(e) => {
                  markEdited();
                  setDraftPaid(e.target.checked);
                }}
                className="accent-brand-blue"
              />
              Pagado
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {justSaved && !dirty && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <IconCheck className="h-4 w-4" /> Guardado
            </span>
          )}
          {saveError && <span className="text-xs text-red-500">{saveError}</span>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !dirty}
          className="w-full rounded-xl bg-brand-blue px-8 py-3 text-base font-semibold text-white shadow-md shadow-brand-blue/30 transition-colors hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <ConfirmWonDialog
        leadId={leadId}
        plan={draftPlan}
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirmed={(confirmedPlan) => {
          setDraftStatus("ganado");
          setDraftPlan(confirmedPlan);
          setDraftPaid(true);
          setBaseline({ status: "ganado", plan: confirmedPlan, paid: true });
          setConfirmOpen(false);
          setJustSaved(true);
        }}
      />
    </div>
  );
}
