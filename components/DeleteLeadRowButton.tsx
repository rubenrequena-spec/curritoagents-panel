"use client";

import { useState, useTransition } from "react";
import { deleteLead } from "@/app/actions/leads";
import { IconTrash } from "@/components/icons";

export function DeleteLeadRowButton({ leadId, label }: { leadId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteLead(leadId, "/leads");
      if (!result.success) setError(result.error);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title={`Eliminar ${label}`}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
      >
        <IconTrash className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-ink">
                ¿Eliminar {label}?
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Esta acción es irreversible: se borrarán también sus notas, tareas y su ficha de
                cliente si la tiene.
              </p>
            </div>
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
    </>
  );
}
