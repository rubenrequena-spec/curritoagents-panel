"use client";

import { useState, useTransition } from "react";
import { updateLeadGeneral } from "@/app/actions/leads";
import { IconCheck } from "@/components/icons";

type GeneralFields = {
  email: string | null;
  telefono: string | null;
};

export function GeneralInfoForm({
  leadId,
  email,
  telefono,
  readOnlyFields,
  children,
}: {
  leadId: string;
  email: string | null;
  telefono: string | null;
  readOnlyFields: [string, string | null][];
  children?: React.ReactNode;
}) {
  const initial: GeneralFields = { email, telefono };
  const [baseline, setBaseline] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = draft.email !== baseline.email || draft.telefono !== baseline.telefono;

  const handleChange = (key: keyof GeneralFields, value: string) => {
    setJustSaved(false);
    setSaveError(null);
    setDraft((prev) => ({ ...prev, [key]: value || null }));
  };

  const handleSave = () => {
    setSaveError(null);
    startSaving(async () => {
      const result = await updateLeadGeneral(leadId, draft);
      if (result.success) {
        setBaseline(draft);
        setJustSaved(true);
      } else {
        setSaveError(result.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wide text-slate-400">Email</span>
        <input
          type="email"
          value={draft.email ?? ""}
          disabled={isSaving}
          onChange={(e) => handleChange("email", e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wide text-slate-400">Teléfono</span>
        <input
          type="tel"
          value={draft.telefono ?? ""}
          disabled={isSaving}
          onChange={(e) => handleChange("telefono", e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
        />
      </label>

      {readOnlyFields.map(([label, value]) => (
        <div key={label}>
          <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
          <div className="text-brand-ink">{value || "—"}</div>
        </div>
      ))}

      {children}

      <div className="col-span-2 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
