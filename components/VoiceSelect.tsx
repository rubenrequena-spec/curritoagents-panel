"use client";

import { useState, useTransition } from "react";
import { updateLeadVoz } from "@/app/actions/leads";
import { VOZ_OPTIONS } from "@/lib/constants";
import { IconCheck } from "@/components/icons";

export function VoiceSelect({ leadId, voz }: { leadId: string; voz: string | null }) {
  const [current, setCurrent] = useState(voz ?? "");
  const [isSaving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setCurrent(value);
    setSaved(false);
    setError(null);
    startSaving(async () => {
      const result = await updateLeadVoz(leadId, value || null);
      if (result.success) setSaved(true);
      else setError(result.error);
    });
  };

  return (
    <div>
      <span className="text-xs uppercase tracking-wide text-slate-400">Voz</span>
      <div className="flex items-center gap-2">
        <select
          value={current}
          disabled={isSaving}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
        >
          <option value="">Sin asignar</option>
          {VOZ_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {saved && !isSaving && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <IconCheck className="h-4 w-4" /> Guardado
          </span>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
