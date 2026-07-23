import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, SOURCE_LABELS } from "@/lib/constants";
import { StatusSelect } from "@/components/StatusSelect";
import type { Lead } from "@/lib/database.types";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  const leads = data as Lead[] | null;

  const byStatus = STATUS_ORDER.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s] = (leads ?? []).filter((lead) => lead.status === s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pipeline</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 space-y-3 min-h-[200px]"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center justify-between">
              <span>{STATUS_LABELS[status]}</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5">
                {byStatus[status]?.length ?? 0}
              </span>
            </div>
            <div className="space-y-2">
              {(byStatus[status] ?? []).map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2"
                >
                  <Link
                    href={`/leads/${lead.id}`}
                    className="block font-medium text-sm text-white hover:underline"
                  >
                    {lead.nombre}
                  </Link>
                  <div className="text-xs text-slate-400">{lead.negocio}</div>
                  <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px]">
                    {SOURCE_LABELS[lead.source] ?? lead.source}
                  </span>
                  <StatusSelect
                    leadId={lead.id}
                    status={lead.status}
                    className="w-full rounded-md bg-slate-800 border border-slate-700 text-xs px-2 py-1 disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
