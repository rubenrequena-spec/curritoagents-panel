"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClientManual } from "@/app/actions/clients";
import { PLAN_LABELS, SOURCE_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type LeadPlan = Database["public"]["Enums"]["lead_plan"];
type LeadSource = Database["public"]["Enums"]["lead_source"];

const EMPTY = {
  nombre: "",
  negocio: "",
  email: "",
  telefono: "",
  plan: "" as LeadPlan | "",
  source: "a_medida" as LeadSource,
};

export function NewClientDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setForm(EMPTY);
    setError(null);
  };

  const handleSubmit = () => {
    if (!form.plan) return;
    setError(null);
    startTransition(async () => {
      const result = await createClientManual({
        nombre: form.nombre,
        negocio: form.negocio,
        email: form.email || null,
        telefono: form.telefono || null,
        plan: form.plan as LeadPlan,
        source: form.source,
      });
      if (result.success) {
        close();
        router.push(`/clientes/${result.clientId}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
      >
        Nuevo cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-ink">Nuevo cliente</h3>
              <p className="mt-1 text-sm text-slate-500">
                Se crea directamente como <strong>Activado</strong> y <strong>Pagado</strong>, sin
                pasar por el pipeline.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Nombre *</span>
                <input
                  value={form.nombre}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Negocio *</span>
                <input
                  value={form.negocio}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, negocio: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Email</span>
                <input
                  type="email"
                  value={form.email}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Teléfono</span>
                <input
                  type="tel"
                  value={form.telefono}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Plan *</span>
                <select
                  value={form.plan}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as LeadPlan }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                >
                  <option value="" disabled>
                    Selecciona un plan...
                  </option>
                  {Object.entries(PLAN_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Tipo</span>
                <select
                  value={form.source}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as LeadSource }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                >
                  {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={isPending}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !form.nombre.trim() || !form.negocio.trim() || !form.plan}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Creando..." : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
