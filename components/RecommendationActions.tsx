"use client";

import { useState, useTransition } from "react";
import { resolveRecommendation } from "@/app/actions/ads";

export function RecommendationActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleResolve = (next: "applied" | "dismissed") => {
    setError(null);
    startTransition(async () => {
      const result = await resolveRecommendation(id, next);
      if (result.success) setCurrent(next);
      else setError(result.error);
    });
  };

  if (current !== "open") {
    return (
      <span className="text-xs text-slate-400">
        {current === "applied" ? "Aplicada" : "Descartada"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleResolve("applied")}
        disabled={isPending}
        className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
      >
        Aplicada
      </button>
      <button
        type="button"
        onClick={() => handleResolve("dismissed")}
        disabled={isPending}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        Descartar
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
