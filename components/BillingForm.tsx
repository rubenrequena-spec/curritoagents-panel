"use client";

import { useState, useTransition } from "react";
import { updateLeadBilling } from "@/app/actions/leads";
import { IconCheck } from "@/components/icons";

type BillingFields = {
  razonSocial: string | null;
  cifNif: string | null;
  direccion: string | null;
  codigoPostal: string | null;
  provincia: string | null;
  personaContacto: string | null;
};

const FIELDS: [keyof BillingFields, string][] = [
  ["razonSocial", "Razón social"],
  ["cifNif", "CIF/NIF"],
  ["direccion", "Dirección"],
  ["codigoPostal", "Código postal"],
  ["provincia", "Provincia"],
  ["personaContacto", "Persona de contacto"],
];

export function BillingForm({
  leadId,
  razonSocial,
  cifNif,
  direccion,
  codigoPostal,
  provincia,
  personaContacto,
}: { leadId: string } & BillingFields) {
  const initial: BillingFields = {
    razonSocial,
    cifNif,
    direccion,
    codigoPostal,
    provincia,
    personaContacto,
  };
  const [baseline, setBaseline] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = FIELDS.some(([key]) => draft[key] !== baseline[key]);

  const handleChange = (key: keyof BillingFields, value: string) => {
    setJustSaved(false);
    setSaveError(null);
    setDraft((prev) => ({ ...prev, [key]: value || null }));
  };

  const handleSave = () => {
    setSaveError(null);
    startSaving(async () => {
      const result = await updateLeadBilling(leadId, draft);
      if (result.success) {
        setBaseline(draft);
        setJustSaved(true);
      } else {
        setSaveError(result.error);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-display text-lg font-medium text-brand-ink">Datos de facturación</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map(([key, label]) => (
          <label key={key} className="space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
            <input
              type="text"
              value={draft[key] ?? ""}
              disabled={isSaving}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
            />
          </label>
        ))}
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
          className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
