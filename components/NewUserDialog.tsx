"use client";

import { useState, useTransition } from "react";
import { createTeamMember } from "@/app/actions/users";
import type { Database } from "@/lib/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

const EMPTY = { email: "", password: "", fullName: "", role: "comercial" as UserRole };

export function NewUserDialog() {
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
      const result = await createTeamMember(form);
      if (result.success) {
        close();
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
        Nuevo usuario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-ink">Nuevo usuario</h3>
              <p className="mt-1 text-sm text-slate-500">
                Define tú mismo la contraseña inicial y pásasela a la persona por otro canal.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Nombre completo
                </span>
                <input
                  value={form.fullName}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Email *</span>
                <input
                  type="email"
                  value={form.email}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Contraseña inicial *
                </span>
                <input
                  type="text"
                  value={form.password}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Rol</span>
                <select
                  value={form.role}
                  disabled={isPending}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                >
                  <option value="comercial">Comercial</option>
                  <option value="admin">Admin</option>
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
                disabled={isPending || !form.email.trim() || form.password.length < 8}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
