import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { PLAN_LABELS, PLAN_PRICES } from "@/lib/constants";
import { currentMonthValue, addMonths, monthRange, monthKeyFromDate, shortMonthLabel } from "@/lib/month";
import { IconUsers, IconSpark, IconClock, IconCheck, IconUserMinus, IconX } from "@/components/icons";
import { LeadsMonthlyChart, type LeadsMonthPoint } from "@/components/LeadsMonthlyChart";
import { RevenueMonthlyChart, type RevenueMonthPoint } from "@/components/RevenueMonthlyChart";
import type { Database } from "@/lib/database.types";

type LeadPlan = Database["public"]["Enums"]["lead_plan"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect("/leads");

  const { rango: rangoParam } = await searchParams;
  const rango = rangoParam === "12" ? "12" : "6";
  const monthsCount = Number(rango);

  const supabase = await createClient();

  const { data: statsData } = await supabase.from("leads").select("status, plan, paid");
  const statsLeads = statsData ?? [];

  const total = statsLeads.length;
  const nuevos = statsLeads.filter((l) => l.status === "nuevo").length;
  const enProceso = statsLeads.filter((l) =>
    ["contactado", "demo_agendada", "demo_hecha"].includes(l.status),
  ).length;
  const activados = statsLeads.filter((l) => l.status === "ganado").length;
  const perdidos = statsLeads.filter((l) => l.status === "perdido").length;

  const stats = [
    { label: "Leads totales", value: total, icon: IconUsers, accent: "text-brand-blue bg-blue-50" },
    { label: "Nuevos", value: nuevos, icon: IconSpark, accent: "text-brand-orange bg-orange-50" },
    { label: "En proceso", value: enProceso, icon: IconClock, accent: "text-indigo-600 bg-indigo-50" },
    { label: "Activados", value: activados, icon: IconCheck, accent: "text-emerald-600 bg-emerald-50" },
    { label: "Perdidos", value: perdidos, icon: IconX, accent: "text-red-600 bg-red-50" },
  ];

  // Agentes activos / MRR / bajas: se calculan sobre `clients`, no directamente
  // sobre `leads` — un lead "activado" (ganado) puede haberse dado de baja
  // después sin dejar de estar "ganado" a nivel de lead.
  const { data: clientsData } = await supabase
    .from("clients")
    .select("status, lead:leads(plan, paid, closed_at)");
  const clients = (clientsData ?? []) as unknown as {
    status: "activo" | "baja";
    lead: { plan: LeadPlan | null; paid: boolean; closed_at: string | null } | null;
  }[];

  const activeClients = clients.filter((c) => c.status === "activo" && c.lead?.paid);
  const activeAgents = activeClients.length;
  const activeAgentsByPlan = (Object.keys(PLAN_LABELS) as Array<keyof typeof PLAN_LABELS>).map(
    (p) => ({
      label: PLAN_LABELS[p],
      value: activeClients.filter((c) => c.lead?.plan === p).length,
    }),
  );
  const bajas = clients.filter((c) => c.status === "baja").length;

  // Gráficos mensuales: meses del más antiguo al más reciente.
  const currentMonth = currentMonthValue();
  const months = Array.from({ length: monthsCount }, (_, i) =>
    addMonths(currentMonth, -(monthsCount - 1 - i)),
  );
  const oldestStart = monthRange(months[0]).start;

  const { data: funnelLeadsData } = await supabase
    .from("leads")
    .select("created_at, status")
    .gte("created_at", oldestStart);
  const funnelByMonth = new Map(
    months.map((m) => [m, { capturados: 0, enProceso: 0, activados: 0, perdidos: 0 }]),
  );
  for (const lead of funnelLeadsData ?? []) {
    const bucket = funnelByMonth.get(monthKeyFromDate(lead.created_at));
    if (!bucket) continue;
    bucket.capturados += 1;
    if (["contactado", "demo_agendada", "demo_hecha"].includes(lead.status)) bucket.enProceso += 1;
    else if (lead.status === "ganado") bucket.activados += 1;
    else if (lead.status === "perdido") bucket.perdidos += 1;
  }
  const leadsChartData: LeadsMonthPoint[] = months.map((m) => ({
    month: shortMonthLabel(m),
    ...funnelByMonth.get(m)!,
  }));

  const { data: revenueLeadsData } = await supabase
    .from("leads")
    .select("closed_at, plan")
    .eq("status", "ganado")
    .eq("paid", true)
    .gte("closed_at", oldestStart);
  const revenueByMonth = new Map(months.map((m) => [m, 0]));
  for (const lead of revenueLeadsData ?? []) {
    if (!lead.closed_at || !lead.plan) continue;
    const key = monthKeyFromDate(lead.closed_at);
    if (revenueByMonth.has(key)) {
      revenueByMonth.set(
        key,
        (revenueByMonth.get(key) ?? 0) + PLAN_PRICES[lead.plan as keyof typeof PLAN_PRICES],
      );
    }
  }
  const revenueChartData: RevenueMonthPoint[] = months.map((m) => ({
    month: shortMonthLabel(m),
    ingresos: revenueByMonth.get(m) ?? 0,
  }));

  // Ingresos del mes actual = activaciones nuevas de este mes (recién
  // ganadas, misma cifra que la barra actual del gráfico de abajo) +
  // clientes recurrentes que ya pagaban de meses anteriores y siguen
  // activos. Evita contar dos veces a quien se activó este mismo mes.
  const ingresosNuevosEsteMes = revenueByMonth.get(currentMonth) ?? 0;
  const ingresosRecurrentes = activeClients
    .filter((c) => !c.lead?.closed_at || monthKeyFromDate(c.lead.closed_at) !== currentMonth)
    .reduce((sum, c) => sum + (c.lead?.plan ? PLAN_PRICES[c.lead.plan] : 0), 0);
  const ingresosTotalMes = ingresosNuevosEsteMes + ingresosRecurrentes;

  const rangoHref = (r: "6" | "12") => `/dashboard${r === "6" ? "" : `?rango=${r}`}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-ink">Dashboard</h1>
        <p className="text-sm text-slate-500">Vista general del negocio.</p>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Agentes activos</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50">
              <IconCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-brand-ink">
                {activeAgents}
              </div>
              <div className="text-xs text-slate-500">Total activos</div>
            </div>
          </div>
          {activeAgentsByPlan.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-blue bg-blue-50">
                <IconCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-xl font-semibold text-brand-ink">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 bg-slate-100">
              <IconUserMinus className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-brand-ink">{bajas}</div>
              <div className="text-xs text-slate-500">Bajas</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Ingresos</h2>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:w-fit sm:min-w-[280px]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50">
            <span className="text-lg font-semibold">€</span>
          </div>
          <div>
            <div className="font-display text-xl font-semibold text-brand-ink">
              {ingresosTotalMes.toLocaleString("es-ES")} €/mes
            </div>
            <div className="text-xs text-slate-500">
              {ingresosNuevosEsteMes.toLocaleString("es-ES")} € nuevos +{" "}
              {ingresosRecurrentes.toLocaleString("es-ES")} € recurrentes · +IVA no incluido
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-brand-ink">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-brand-ink">Leads por mes</h2>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <Link
              href={rangoHref("6")}
              className={`rounded-md px-3 py-1 font-medium ${
                rango === "6" ? "bg-brand-blue text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              6 meses
            </Link>
            <Link
              href={rangoHref("12")}
              className={`rounded-md px-3 py-1 font-medium ${
                rango === "12" ? "bg-brand-blue text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              12 meses
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <LeadsMonthlyChart data={leadsChartData} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Ingresos por mes</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <RevenueMonthlyChart data={revenueChartData} />
        </div>
        <p className="text-xs text-slate-400">
          Ingresos nuevos firmados cada mes (leads activados y pagados ese mes, según su plan). La
          barra del mes actual es el componente &quot;nuevos&quot; de la tarjeta de arriba; sumado
          a los clientes recurrentes de meses anteriores da el total del mes.
        </p>
      </div>
    </div>
  );
}
