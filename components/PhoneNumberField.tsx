"use client";

import { useState, useTransition } from "react";
import { setClientPhoneNumber } from "@/app/actions/clients";
import { IconCheck } from "@/components/icons";

export function PhoneNumberField({
  clientId,
  phoneNumber,
}: {
  clientId: string;
  phoneNumber: string | null;
}) {
  const [baseline, setBaseline] = useState(phoneNumber ?? "");
  const [draft, setDraft] = useState(phoneNumber ?? "");
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = draft !== baseline;

  const handleChange = (value: string) => {
    setDraft(value);
    setJustSaved(false);
    setSaveError(null);
  };

  const handleSave = () => {
    setSaveError(null);
    startSaving(async () => {
      const result = await setClientPhoneNumber(clientId, draft || null);
      if (result.success) {
        setBaseline(draft);
        setJustSaved(true);
      } else {
        setSaveError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex-1 min-w-[200px] space-y-1">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Número de teléfono asignado
        </span>
        <input
          type="tel"
          value={draft}
          disabled={isSaving}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="+34XXXXXXXXX"
          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
        />
      </label>
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !dirty}
        className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSaving ? "Guardando..." : "Guardar"}
      </button>
      {justSaved && !dirty && (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <IconCheck className="h-4 w-4" /> Guardado
        </span>
      )}
      {saveError && <span className="text-xs text-red-500">{saveError}</span>}
    </div>
  );
}
