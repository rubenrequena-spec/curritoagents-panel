import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES, SOURCE_LABELS } from "@/lib/constants";
import { LeadsTable } from "@/components/LeadsTable";
import { NewLeadDialog } from "@/components/NewLeadDialog";
import { Badge } from "@/components/Badge";
import { IconSearch } from "@/components/icons";
import type { Lead } from "@/lib/database.types";

const LEADS_PAGE_SIZE = 10;

function LeadsFilterForm({ source, status, q }: { source?: string; status?: string; q?: string }) {
  return (
    <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <select
        name="source"
        defaultValue={source ?? ""}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
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
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
      >
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="relative flex-1 min-w-[220px]">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre, negocio, email o teléfono..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-brand-ink outline-none focus:border-brand-blue"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
      >
        Filtrar
      </button>
    </form>
  );
}

function Pager({
  page,
  totalPages,
  pageHref,
}: {
  page: number;
  totalPages: number;
  pageHref: (targetPage: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
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
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; status?: string; q?: string; page?: string }>;
}) {
  const { source, status, q, page: pageParam } = await searchParams;
  const hasFilters = Boolean(source || status || q);
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();

  let mainQuery = supabase.from("leads").select("*", { count: "exact" });
  if (hasFilters) {
    if (source) mainQuery = mainQuery.eq("source", source);
    if (status) mainQuery = mainQuery.eq("status", status);
    if (q) {
      const pattern = `"%${q.replace(/"/g, '\\"')}%"`;
      mainQuery = mainQuery.or(
        `nombre.ilike.${pattern},negocio.ilike.${pattern},email.ilike.${pattern},telefono.ilike.${pattern},contacto.ilike.${pattern}`,
      );
    }
  } else {
    mainQuery = mainQuery.neq("status", "nuevo");
  }
  mainQuery = mainQuery
    .order("created_at", { ascending: false })
    .range((page - 1) * LEADS_PAGE_SIZE, (page - 1) * LEADS_PAGE_SIZE + LEADS_PAGE_SIZE - 1);

  const { data: mainData, count: mainCount, error } = await mainQuery;
  const mainLeads = (mainData as Lead[] | null) ?? [];
  const totalPages = Math.max(1, Math.ceil((mainCount ?? 0) / LEADS_PAGE_SIZE));

  let nuevoLeads: Lead[] = [];
  if (!hasFilters) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "nuevo")
      .order("created_at", { ascending: false });
    nuevoLeads = (data as Lead[] | null) ?? [];
  }

  const { data: statusCountsData } = await supabase.from("leads").select("status");
  const statusCounts = statusCountsData ?? [];
  const countsByStatus = STATUS_ORDER.map((s) => ({
    status: s,
    count: statusCounts.filter((l) => l.status === s).length,
  }));

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/leads${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-ink">Leads</h1>
          <p className="text-sm text-slate-500">
            Todos los leads recibidos desde la web y el asistente de configuración.
          </p>
        </div>
        <NewLeadDialog />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {countsByStatus.map(({ status: s, count }) => (
          <div
            key={s}
            className="flex flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Badge className={STATUS_STYLES[s]}>{STATUS_LABELS[s]}</Badge>
            <span className="font-display text-2xl font-semibold text-brand-ink">{count}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error.message}</p>}

      {hasFilters && <LeadsFilterForm source={source} status={status} q={q} />}

      {hasFilters ? (
        <div className="space-y-3">
          <LeadsTable leads={mainLeads} />
          <Pager page={page} totalPages={totalPages} pageHref={pageHref} />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="font-display text-lg font-medium text-brand-ink">Nuevos</h2>
            <LeadsTable leads={nuevoLeads} emptyMessage="No hay leads nuevos." />
          </div>

          <LeadsFilterForm source={source} status={status} q={q} />

          <div className="space-y-3">
            <h2 className="font-display text-lg font-medium text-brand-ink">Otros leads</h2>
            <LeadsTable leads={mainLeads} emptyMessage="No hay más leads." />
            <Pager page={page} totalPages={totalPages} pageHref={pageHref} />
          </div>
        </>
      )}
    </div>
  );
}
