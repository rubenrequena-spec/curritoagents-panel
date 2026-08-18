"use client";

import { useState, useTransition } from "react";
import { resolveRecommendation, deleteRecommendation } from "@/app/actions/ads";
import { IconTrash } from "@/components/icons";

export function RecommendationActions({ id, status }: { id: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleResolve = (next: "applied" | "dismissed") => {
    setError(null);
    startTransition(async () => {
      const result = await resolveRecommendation(id, next);
      if (result.success) setCurrent(next);
      else setError(result.error);
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteRecommendation(id);
      if (!result.success) setError(result.error);
    });
  };

  if (current !== "open") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">
          {current === "applied" ? "Aplicada" : "Descartada"}
        </span>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          title="Eliminar recomendación"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <IconTrash className="h-4 w-4" />
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}

        {confirmingDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => !isPending && setConfirmingDelete(false)}
          >
            <div
              className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-brand-ink">
                  ¿Eliminar esta recomendación?
                </h3>
                <p className="mt-1 text-sm text-slate-500">Esta acción es irreversible.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isPending}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
