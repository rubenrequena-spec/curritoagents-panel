import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  PLAN_LABELS,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_STYLES,
} from "@/lib/constants";
import { Badge, Avatar } from "@/components/Badge";
import { NewClientDialog } from "@/components/NewClientDialog";
import type { Client, Lead } from "@/lib/database.types";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*, lead:leads(*)")
    .order("created_at", { ascending: false });
  const clients = data as (Client & { lead: Lead })[] | null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-ink">Clientes</h1>
          <p className="text-sm text-slate-500">
            Leads que han pasado a estado activado se clasifican aquí automáticamente.
          </p>
        </div>
        <NewClientDialog />
      </div>

      {error && <p className="text-sm text-red-500">{error.message}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Negocio</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Estado del lead</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Cliente desde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(clients ?? []).map((client) => (
              <tr key={client.id} className="transition-colors hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  <Link href={`/clientes/${client.id}`} className="flex items-center gap-3">
                    <Avatar name={client.lead.nombre} />
                    <span className="font-medium text-brand-ink hover:text-brand-blue">
                      {client.lead.nombre}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{client.lead.negocio}</td>
                <td className="px-4 py-3 text-slate-500">{client.phone_number || "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {client.lead.plan ? PLAN_LABELS[client.lead.plan] : "Sin plan"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_STYLES[client.lead.status]}>
                    {STATUS_LABELS[client.lead.status] ?? client.lead.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={CLIENT_STATUS_STYLES[client.status]}>
                    {CLIENT_STATUS_LABELS[client.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(client.created_at).toLocaleDateString("es-ES")}
                </td>
              </tr>
            ))}
            {(clients ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Todavía no hay clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
