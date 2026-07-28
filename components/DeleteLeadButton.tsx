"use client";

import { useState, useTransition } from "react";
import { deleteLead } from "@/app/actions/leads";
import { IconTrash } from "@/components/icons";

export function DeleteLeadButton({
  leadId,
  label,
  redirectTo,
}: {
  leadId: string;
  label: string;
  redirectTo: "/leads" | "/clientes";
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      // On success deleteLead calls redirect() internally and this promise
      // never resolves on this line — only a failure returns a value here.
      const result = await deleteLead(leadId, redirectTo);
      if (!result.success) setError(result.error);
    });
  };

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
      <h2 className="font-display text-sm font-medium text-red-700">Zona de peligro</h2>
      <p className="mt-1 text-xs text-red-600">
        Esta acción elimina permanentemente {label}, junto con sus notas, tareas y datos de
        cliente asociados. No se puede deshacer.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
      >
        <IconTrash className="h-3.5 w-3.5" />
        Eliminar {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
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
    </div>
  );
}
