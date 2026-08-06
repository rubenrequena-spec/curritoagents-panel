"use client";

import { useState, useTransition } from "react";
import { exportLeadsToCsv, type ExportLeadsFilters } from "@/app/actions/leads";

export function ExportLeadsButton({ filters }: { filters: ExportLeadsFilters }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      const result = await exportLeadsToCsv(filters);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {isPending ? "Exportando..." : "Exportar CSV"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
