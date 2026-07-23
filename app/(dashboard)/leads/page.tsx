import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, SOURCE_LABELS } from "@/lib/constants";
import type { Lead } from "@/lib/database.types";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; status?: string; q?: string }>;
}) {
  const { source, status, q } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  const leads = data as Lead[] | null;

  const filtered = (leads ?? []).filter((lead) => {
    if (source && lead.source !== source) return false;
    if (status && lead.status !== status) return false;
    if (!q) return true;
    const haystack = `${lead.nombre} ${lead.negocio} ${lead.email ?? ""} ${lead.telefono ?? ""} ${lead.contacto ?? ""}`.toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leads</h1>

      <form className="flex flex-wrap gap-3">
        <select
          name="source"
          defaultValue={source ?? ""}
          className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre, negocio, email o teléfono..."
          className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm flex-1 min-w-[220px]"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium"
        >
          Filtrar
        </button>
      </form>

      {error && <p className="text-red-400 text-sm">{error.message}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="text-blue-400 hover:underline">
                    {lead.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3">{lead.negocio}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-xs">
                    {SOURCE_LABELS[lead.source] ?? lead.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {lead.email || lead.telefono || lead.contacto || "—"}
                </td>
                <td className="px-4 py-3">{STATUS_LABELS[lead.status] ?? lead.status}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(lead.created_at).toLocaleString("es-ES")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay leads todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
