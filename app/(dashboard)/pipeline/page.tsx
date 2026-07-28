import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABELS,
  PIPELINE_STATUS_ORDER,
  CLOSED_STATUSES,
  SOURCE_LABELS,
  STATUS_STYLES,
  STATUS_DOT,
  SOURCE_STYLES,
  PLAN_LABELS,
} from "@/lib/constants";
import { currentMonthValue, monthRange, formatMonthLabel } from "@/lib/month";
import { StatusSelect } from "@/components/StatusSelect";
import { Badge, Avatar } from "@/components/Badge";
import type { Lead } from "@/lib/database.types";

const HISTORY_PAGE_SIZE = 5;

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; plan?: string; mes?: string; page?: string }>;
}) {
  const { estado = "todos", plan = "todos", mes: mesParam, page: pageParam } = await searchParams;
  const metricMonth = mesParam || currentMonthValue();
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();

  // 1. Kanban: solo leads abiertos
  const { data: openData } = await supabase
    .from("leads")
    .select("*")
    .in("status", PIPELINE_STATUS_ORDER)
    .order("created_at", { ascending: false });
  const openLeads = openData as Lead[] | null;
  const byStatus = PIPELINE_STATUS_ORDER.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s] = (openLeads ?? []).filter((lead) => lead.status === s);
    return acc;
  }, {});

  // 2. Métrica ganados/perdidos del mes (siempre acotada a metricMonth)
  const { start: metricStart, end: metricEnd } = monthRange(metricMonth);
  const { count: ganadosMes } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "ganado")
    .gte("closed_at", metricStart)
    .lt("closed_at", metricEnd);
  const { count: perdidosMes } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "perdido")
    .gte("closed_at", metricStart)
    .lt("closed_at", metricEnd);

  // 3. Histórico: cerrados, filtrado + paginado. El mes solo se aplica si el
  // usuario lo eligió explícitamente — por defecto se ven los 5 más recientes.
  let historyQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("closed_at", { ascending: false, nullsFirst: false })
    .range((page - 1) * HISTORY_PAGE_SIZE, (page - 1) * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE - 1);
  historyQuery =
    estado === "todos" ? historyQuery.in("status", CLOSED_STATUSES) : historyQuery.eq("status", estado);
  if (plan !== "todos") historyQuery = historyQuery.eq("plan", plan);
  if (mesParam) {
    const r = monthRange(mesParam);
    historyQuery = historyQuery.gte("closed_at", r.start).lt("closed_at", r.end);
  }
  const { data: historyData, count: historyCount } = await historyQuery;
  const history = historyData as Lead[] | null;
  const totalPages = Math.max(1, Math.ceil((historyCount ?? 0) / HISTORY_PAGE_SIZE));

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (estado !== "todos") params.set("estado", estado);
    if (plan !== "todos") params.set("plan", plan);
    if (mesParam) params.set("mes", mesParam);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/pipeline${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-ink">Pipeline</h1>
        <p className="text-sm text-slate-500">
          Los leads activados o perdidos pasan al histórico y salen del tablero.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PIPELINE_STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="flex min-h-[220px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="flex items-center gap-1.5 pt-0.5 leading-tight">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                {STATUS_LABELS[status]}
              </span>
              <Badge className={`shrink-0 ${STATUS_STYLES[status]}`}>
                {byStatus[status]?.length ?? 0}
              </Badge>
            </div>
            <div className="space-y-2">
              {(byStatus[status] ?? []).map((lead) => (
                <div
                  key={lead.id}
                  className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link href={`/leads/${lead.id}`} className="flex items-center gap-2.5">
                    <Avatar name={lead.nombre} className="h-7 w-7 text-xs" />
                    <span className="truncate text-sm font-medium text-brand-ink hover:text-brand-blue">
                      {lead.nombre}
                    </span>
                  </Link>
                  <div className="truncate text-xs text-slate-500">{lead.negocio}</div>
                  <Badge className={`${SOURCE_STYLES[lead.source]} text-[10px]`}>
                    {SOURCE_LABELS[lead.source] ?? lead.source}
                  </Badge>
                  <StatusSelect
                    leadId={lead.id}
                    status={lead.status}
                    plan={lead.plan}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
                  />
                </div>
              ))}
              {(byStatus[status] ?? []).length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  Sin leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-medium text-brand-ink">Historial</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50">
              <span className="text-lg font-semibold">✓</span>
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-brand-ink">
                {ganadosMes ?? 0}
              </div>
              <div className="text-xs text-slate-500">Activados en {formatMonthLabel(metricMonth)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-600 bg-red-50">
              <span className="text-lg font-semibold">✕</span>
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-brand-ink">
                {perdidosMes ?? 0}
              </div>
              <div className="text-xs text-slate-500">Perdidos en {formatMonthLabel(metricMonth)}</div>
            </div>
          </div>
        </div>

        <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <select
            name="estado"
            defaultValue={estado}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
          >
            <option value="todos">Todos los estados</option>
            <option value="ganado">Activado</option>
            <option value="perdido">Perdido</option>
          </select>
          <select
            name="plan"
            defaultValue={plan}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
          >
            <option value="todos">Todos los planes</option>
            {Object.entries(PLAN_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="month"
            name="mes"
            defaultValue={mesParam ?? ""}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Filtrar
          </button>
        </form>

        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {(history ?? []).map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50/40"
            >
              <Badge className={`shrink-0 ${STATUS_STYLES[lead.status]}`}>
                {STATUS_LABELS[lead.status]}
              </Badge>
              <span className="min-w-0 flex-1 truncate font-medium text-brand-ink">
                {lead.nombre}
              </span>
              <span className="hidden shrink-0 text-slate-500 sm:inline">{lead.negocio}</span>
              <Badge className={`shrink-0 ${SOURCE_STYLES[lead.source]} text-[10px]`}>
                {SOURCE_LABELS[lead.source] ?? lead.source}
              </Badge>
              <span className="shrink-0 text-xs text-slate-400">
                {lead.plan ? PLAN_LABELS[lead.plan] : "Sin plan"}
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {lead.closed_at ? new Date(lead.closed_at).toLocaleDateString("es-ES") : "—"}
              </span>
            </Link>
          ))}
          {(history ?? []).length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Sin leads cerrados con estos filtros.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-brand-blue hover:underline">
                ← Anterior
              </Link>
            ) : (
              <span className="text-slate-300">← Anterior</span>
            )}
            <span className="text-slate-500">
              Página {page} de {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="text-brand-blue hover:underline">
                Siguiente →
              </Link>
            ) : (
              <span className="text-slate-300">Siguiente →</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
