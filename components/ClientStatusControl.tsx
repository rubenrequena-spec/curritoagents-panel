"use client";

import { useState, useTransition } from "react";
import { setClientStatus } from "@/app/actions/clients";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_STYLES } from "@/lib/constants";
import { Badge } from "@/components/Badge";
import { IconUserMinus, IconUserCheck } from "@/components/icons";
import type { Database } from "@/lib/database.types";

type ClientStatus = Database["public"]["Enums"]["client_status"];

export function ClientStatusControl({
  clientId,
  status,
}: {
  clientId: string;
  status: ClientStatus;
}) {
  const [current, setCurrent] = useState(status);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const applyStatus = (next: ClientStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await setClientStatus(clientId, next);
      if (result.success) {
        setCurrent(next);
        setConfirmOpen(false);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className={CLIENT_STATUS_STYLES[current]}>{CLIENT_STATUS_LABELS[current]}</Badge>
      {current === "activo" ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
        >
          <IconUserMinus className="h-3.5 w-3.5" />
          Dar de baja
        </button>
      ) : (
        <button
          type="button"
          onClick={() => applyStatus("activo")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 disabled:opacity-50"
        >
          <IconUserCheck className="h-3.5 w-3.5" />
          Reactivar
        </button>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-ink">
                ¿Dar de baja a este cliente?
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                El cliente deja de contar como activo en las métricas del panel (y en los
                ingresos mensuales), pero su ficha, notas y tareas se conservan. Puedes
                reactivarlo cuando quieras.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => applyStatus("baja")}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Sí, dar de baja"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
