"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLeadManual } from "@/app/actions/leads";
import { SOURCE_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type LeadSource = Database["public"]["Enums"]["lead_source"];

const EMPTY = { nombre: "", negocio: "", email: "", telefono: "", contacto: "", source: "a_medida" as LeadSource };

export function NewLeadDialog() {
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
    setError(null);
    startTransition(async () => {
      const result = await createLeadManual({
        nombre: form.nombre,
        negocio: form.negocio,
        email: form.email || null,
        telefono: form.telefono || null,
        contacto: form.contacto || null,
        source: form.source,
      });
      if (result.success) {
        close();
        router.push(`/leads/${result.leadId}`);
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
        Nuevo lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="font-display text-lg font-semibold text-brand-ink">Nuevo lead</h3>

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
                <span className="text-xs uppercase tracking-wide text-slate-400">Contacto</span>
                <input
                  value={form.contacto}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
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
                disabled={isPending || !form.nombre.trim() || !form.negocio.trim()}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Creando..." : "Crear lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
