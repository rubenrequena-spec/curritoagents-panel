import Link from "next/link";
import { STATUS_LABELS, SOURCE_LABELS, STATUS_STYLES, SOURCE_STYLES } from "@/lib/constants";
import { Badge, Avatar } from "@/components/Badge";
import type { Lead } from "@/lib/database.types";

export function LeadsTable({
  leads,
  emptyMessage = "No hay leads todavía.",
}: {
  leads: Lead[];
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Negocio</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Contacto</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <tr key={lead.id} className="transition-colors hover:bg-blue-50/40">
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="flex items-center gap-3">
                  <Avatar name={lead.nombre} />
                  <span className="font-medium text-brand-ink hover:text-brand-blue">
                    {lead.nombre}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{lead.negocio}</td>
              <td className="px-4 py-3">
                <Badge className={SOURCE_STYLES[lead.source]}>
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {lead.email || lead.telefono || lead.contacto || "—"}
              </td>
              <td className="px-4 py-3">
                <Badge className={STATUS_STYLES[lead.status]}>
                  {STATUS_LABELS[lead.status] ?? lead.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {new Date(lead.created_at).toLocaleString("es-ES")}
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
