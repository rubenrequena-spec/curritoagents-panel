"use client";

import { useState, useTransition } from "react";
import { assignLeadOwner } from "@/app/actions/leads";

export function AssignLeadControl({
  leadId,
  ownerId,
  members,
}: {
  leadId: string;
  ownerId: string | null;
  members: { id: string; label: string }[];
}) {
  const [current, setCurrent] = useState(ownerId ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setError(null);
    startTransition(async () => {
      const result = await assignLeadOwner(leadId, value || null);
      if (result.success) setCurrent(value);
      else setError(result.error);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-slate-400">Asignado a</span>
      <select
        value={current}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
      >
        <option value="">Sin asignar</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
