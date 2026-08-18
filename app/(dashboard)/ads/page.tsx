import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { ADS_PRIORITY_LABELS, ADS_PRIORITY_STYLES } from "@/lib/constants";
import { extraString, META_PLATFORM_LABELS } from "@/lib/ads";
import { IconUsers, IconSpark, IconClock } from "@/components/icons";
import { AdsSpendChart, type AdsSpendPoint } from "@/components/AdsSpendChart";
import { RecommendationActions } from "@/components/RecommendationActions";
import { CampaignsTable } from "@/components/CampaignsTable";
import { Badge } from "@/components/Badge";
import type { AdsMetric, AdsRecommendation } from "@/lib/database.types";

// Plan de campaña vivo — ver PLAN_ADS_CURRITOAGENTS.md. Actualizar aquí si Ruben cambia el plan.
const ADS_CAMPAIGN = {
  metaLaunchDate: "2026-08-13",
  metaDailyBudget: 27,
  metaTotalBudget: 510,
  metaBudgetEndDate: "2026-08-31",
  nextCheckpointDate: "2026-08-18",
  cplBenchmarkMin: 3,
  cplBenchmarkMax: 12,
} as const;

const GA4_TOTAL_SESSIONS_DIMENSION = "(sesiones totales)";

const RANGE_DAYS = { day: 1, week: 7, month: 30 } as const;
const RANGE_LABELS = { day: "hoy", week: "últimos 7 días", month: "últimos 30 días" } as const;
const RANGE_TABS = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
] as const;
type AdsRange = keyof typeof RANGE_DAYS;

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; page?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect("/leads");

  const { range: rangeParam, page: pageParam } = await searchParams;
  const range: AdsRange = rangeParam === "day" || rangeParam === "month" ? rangeParam : "week";
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - RANGE_DAYS[range]);
  const startDateStr = startDate.toISOString().slice(0, 10);
  // Nunca recortar antes del lanzamiento de la campaña, aunque el rango elegido llegue más atrás.
  const rangeStartStr =
    startDateStr > ADS_CAMPAIGN.metaLaunchDate ? startDateStr : ADS_CAMPAIGN.metaLaunchDate;

  const { data: metricsData, error: metricsError } = await supabase
    .from("ads_metrics")
    .select("*")
    .gte("fecha", rangeStartStr)
    .order("fecha", { ascending: false });
  const metrics = (metricsData as AdsMetric[] | null) ?? [];

  const { data: recsData, error: recsError } = await supabase
    .from("ads_recommendations")
    .select("*")
    .order("created_at", { ascending: false });
  const recommendations = (recsData as AdsRecommendation[] | null) ?? [];

  const gastoTotal = metrics.reduce((sum, m) => sum + (m.gasto ?? 0), 0);

  const paidMetrics = metrics.filter((m) => m.canal === "meta" || m.canal === "google_ads");
  const gastoPaid = paidMetrics.reduce((sum, m) => sum + (m.gasto ?? 0), 0);
  const conversionesPaid = paidMetrics.reduce((sum, m) => sum + (m.conversiones ?? 0), 0);
  const cplMedio = conversionesPaid > 0 ? gastoPaid / conversionesPaid : null;
  // "Leads totales" cuenta solo conversiones de canales de pago (mismo denominador que el CPL medio) —
  // sumar también los eventos de GA4 aquí contaría la misma llamada dos veces.
  const leadsTotal = conversionesPaid;

  const ga4Metrics = metrics.filter((m) => m.canal === "ga4");
  const ga4EventRows = ga4Metrics.filter((m) => m.dimension !== GA4_TOTAL_SESSIONS_DIMENSION);
  const sesionesTotal = ga4Metrics
    .filter((m) => m.dimension === GA4_TOTAL_SESSIONS_DIMENSION)
    .reduce((sum, m) => sum + (m.sesiones ?? 0), 0);
  const ga4ConversionesTotal = ga4EventRows.reduce((sum, m) => sum + (m.conversiones ?? 0), 0);

  const searchConsoleMetrics = metrics.filter((m) => m.canal === "search_console");

  // Peor anuncio por CPL (regla de revisión día 3/5 del plan).
  type MetaAdAgg = { ad: string; gasto: number; conversiones: number };
  const metaAdAgg = new Map<string, MetaAdAgg>();
  for (const m of metrics) {
    if (m.canal !== "meta") continue;
    const bucket = metaAdAgg.get(m.dimension) ?? { ad: m.dimension, gasto: 0, conversiones: 0 };
    bucket.gasto += m.gasto ?? 0;
    bucket.conversiones += m.conversiones ?? 0;
    metaAdAgg.set(m.dimension, bucket);
  }
  const worstCplAd = Array.from(metaAdAgg.values())
    .map((a) => ({ ...a, cpl: a.conversiones > 0 ? a.gasto / a.conversiones : null }))
    .filter((a): a is MetaAdAgg & { cpl: number } => a.cpl !== null)
    .sort((a, b) => b.cpl - a.cpl)[0] ?? null;

  // Reparto Facebook vs Instagram (hipótesis de audiencia de Ruben).
  const metaPlatformAgg = new Map<string, { gasto: number; conversiones: number }>();
  for (const m of metrics) {
    if (m.canal !== "meta") continue;
    const platform = extraString(m.extra, "publisher_platform") ?? "sin especificar";
    const bucket = metaPlatformAgg.get(platform) ?? { gasto: 0, conversiones: 0 };
    bucket.gasto += m.gasto ?? 0;
    bucket.conversiones += m.conversiones ?? 0;
    metaPlatformAgg.set(platform, bucket);
  }
  const metaGastoForSplit = Array.from(metaPlatformAgg.values()).reduce((s, b) => s + b.gasto, 0);
  const metaByPlatform = Array.from(metaPlatformAgg.entries())
    .map(([platform, b]) => ({
      platform,
      label: META_PLATFORM_LABELS[platform] ?? platform,
      gasto: b.gasto,
      pct: metaGastoForSplit > 0 ? (b.gasto / metaGastoForSplit) * 100 : 0,
    }))
    .sort((a, b) => b.gasto - a.gasto);

  // Ritmo de gasto de Meta vs presupuesto del plan.
  const today = new Date();
  const launch = new Date(ADS_CAMPAIGN.metaLaunchDate);
  const campaignEnd = new Date(ADS_CAMPAIGN.metaBudgetEndDate);
  const totalCampaignDays = Math.round((campaignEnd.getTime() - launch.getTime()) / 86400000) + 1;
  const daysElapsed = Math.min(
    totalCampaignDays,
    Math.max(1, Math.round((today.getTime() - launch.getTime()) / 86400000) + 1),
  );
  const gastoMetaAcumulado = metrics
    .filter((m) => m.canal === "meta" && m.fecha >= ADS_CAMPAIGN.metaLaunchDate)
    .reduce((sum, m) => sum + (m.gasto ?? 0), 0);
  const metaPacingObjetivo = daysElapsed * ADS_CAMPAIGN.metaDailyBudget;
  const metaPacingPct = metaPacingObjetivo > 0 ? (gastoMetaAcumulado / metaPacingObjetivo) * 100 : 0;
  const metaBudgetPct = (gastoMetaAcumulado / ADS_CAMPAIGN.metaTotalBudget) * 100;

  const checkpoint = new Date(ADS_CAMPAIGN.nextCheckpointDate);
  const daysToCheckpoint = Math.ceil((checkpoint.getTime() - today.getTime()) / 86400000);

  const byDate = new Map<string, AdsSpendPoint>();
  for (const m of paidMetrics) {
    if (!byDate.has(m.fecha)) {
      byDate.set(m.fecha, { date: m.fecha, meta: 0, google_ads: 0 });
    }
    const bucket = byDate.get(m.fecha)!;
    bucket[m.canal as "meta" | "google_ads"] += m.gasto ?? 0;
  }
  const chartData: AdsSpendPoint[] = Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({
      ...p,
      date: new Date(p.date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-ink">Ads</h1>
          <p className="text-sm text-slate-500">
            Rendimiento de Meta Ads, Google Ads, GA4 y Search Console — {RANGE_LABELS[range]}.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {RANGE_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/ads?range=${tab.value}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                range === tab.value
                  ? "bg-brand-blue text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {(metricsError || recsError) && (
        <p className="text-sm text-red-500">{metricsError?.message ?? recsError?.message}</p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50">
            <span className="text-lg font-semibold">€</span>
          </div>
          <div>
            <div className="font-display text-xl font-semibold text-brand-ink">
              {gastoTotal.toLocaleString("es-ES")} €
            </div>
            <div className="text-xs text-slate-500">Gasto total</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-indigo-600 bg-indigo-50">
            <span className="text-lg font-semibold">€</span>
          </div>
          <div>
            <div className="font-display text-xl font-semibold text-brand-ink">
              {cplMedio !== null ? `${cplMedio.toLocaleString("es-ES", { maximumFractionDigits: 2 })} €` : "—"}
            </div>
            <div className="text-xs text-slate-500">CPL medio (canales de pago)</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-blue bg-blue-50">
            <IconUsers className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-semibold text-brand-ink">{leadsTotal}</div>
            <div className="text-xs text-slate-500">Leads totales (canales de pago)</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-orange bg-orange-50">
            <IconSpark className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-semibold text-brand-ink">{sesionesTotal}</div>
            <div className="text-xs text-slate-500">Sesiones GA4</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-amber-600 bg-amber-50">
            <IconClock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-semibold text-brand-ink">
              {daysToCheckpoint >= 0 ? `${daysToCheckpoint} días` : "Pasado"}
            </div>
            <div className="text-xs text-slate-500">
              Hasta checkpoint semana 4 ({checkpoint.toLocaleDateString("es-ES")})
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Ritmo de gasto — Meta</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Acumulado vs objetivo a hoy</span>
              <span className="font-medium text-brand-ink">
                {gastoMetaAcumulado.toLocaleString("es-ES")} € / {metaPacingObjetivo.toLocaleString("es-ES")} €
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  metaPacingPct >= 85 && metaPacingPct <= 115
                    ? "bg-emerald-500"
                    : metaPacingPct < 85
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, metaPacingPct)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Día {daysElapsed} de {totalCampaignDays} · ~{ADS_CAMPAIGN.metaDailyBudget} €/día objetivo
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Presupuesto total consumido</span>
              <span className="font-medium text-brand-ink">
                {gastoMetaAcumulado.toLocaleString("es-ES")} € / {ADS_CAMPAIGN.metaTotalBudget} €
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-blue"
                style={{ width: `${Math.min(100, metaBudgetPct)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Hasta el {campaignEnd.toLocaleDateString("es-ES")} · quedan{" "}
              {Math.max(0, ADS_CAMPAIGN.metaTotalBudget - gastoMetaAcumulado).toLocaleString("es-ES")} €
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Gasto diario por canal de pago</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <AdsSpendChart data={chartData} />
        </div>
      </div>

      {worstCplAd && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <span className="font-medium text-amber-800">Peor CPL ahora mismo: </span>
          <span className="text-amber-700">
            {worstCplAd.ad} — {worstCplAd.cpl.toLocaleString("es-ES", { maximumFractionDigits: 2 })} € (
            {worstCplAd.conversiones} conv., {worstCplAd.gasto.toLocaleString("es-ES")} € gastados)
          </span>
        </div>
      )}

      {metaByPlatform.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-brand-ink">Reparto Facebook vs Instagram (Meta)</div>
          {metaByPlatform.map((p) => (
            <div key={p.platform}>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{p.label}</span>
                <span>
                  {p.gasto.toLocaleString("es-ES")} € ({p.pct.toFixed(0)}%)
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-blue" style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">
          Rendimiento de canales de pago (Meta + Google Ads)
        </h2>
        <CampaignsTable
          metrics={paidMetrics}
          page={page}
          pageHref={(targetPage) => `/ads?range=${range}${targetPage > 1 ? `&page=${targetPage}` : ""}`}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">GA4 — sesiones y eventos</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-orange bg-orange-50">
              <IconSpark className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-brand-ink">{sesionesTotal}</div>
              <div className="text-xs text-slate-500">Sesiones totales ({RANGE_LABELS[range]})</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-indigo-600 bg-indigo-50">
              <IconUsers className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-brand-ink">{ga4ConversionesTotal}</div>
              <div className="text-xs text-slate-500">Eventos GA4 (ej. clics a teléfono)</div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Evento</th>
                <th className="px-4 py-3 font-medium">Sesiones</th>
                <th className="px-4 py-3 font-medium">Conversiones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ga4EventRows.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(m.fecha).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.dimension}</td>
                  <td className="px-4 py-3 text-slate-600">{m.sesiones ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{m.conversiones ?? "—"}</td>
                </tr>
              ))}
              {ga4EventRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    Todavía no hay eventos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">
          Search Console — contexto orgánico (SEO)
        </h2>
        <p className="text-xs text-slate-400">
          Informativo. No se mezcla con el gasto ni el CPL/CAC de los canales de pago.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Consulta</th>
                <th className="px-4 py-3 font-medium">Clics</th>
                <th className="px-4 py-3 font-medium">Impresiones</th>
                <th className="px-4 py-3 font-medium">CTR</th>
                <th className="px-4 py-3 font-medium">Posición</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {searchConsoleMetrics.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(m.fecha).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.dimension}</td>
                  <td className="px-4 py-3 text-slate-600">{m.clics ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{m.impresiones ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{m.ctr !== null ? `${m.ctr}%` : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{m.posicion ?? "—"}</td>
                </tr>
              ))}
              {searchConsoleMetrics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Todavía no hay datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Recomendaciones</h2>
        <div className="space-y-2">
          {recommendations.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={ADS_PRIORITY_STYLES[r.priority]}>
                    {ADS_PRIORITY_LABELS[r.priority] ?? r.priority}
                  </Badge>
                  <span className="font-display text-sm font-medium text-brand-ink">{r.title}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{r.summary}</p>
              </div>
              <RecommendationActions id={r.id} status={r.status} />
            </div>
          ))}
          {recommendations.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
              No hay recomendaciones todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
