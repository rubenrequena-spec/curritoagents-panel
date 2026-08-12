import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { ADS_CANAL_LABELS, ADS_PRIORITY_LABELS, ADS_PRIORITY_STYLES } from "@/lib/constants";
import { IconUsers, IconSpark } from "@/components/icons";
import { AdsSpendChart, type AdsSpendPoint } from "@/components/AdsSpendChart";
import { RecommendationActions } from "@/components/RecommendationActions";
import { Badge } from "@/components/Badge";
import type { AdsMetric, AdsRecommendation } from "@/lib/database.types";

export default async function AdsPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect("/leads");

  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startDateStr = startDate.toISOString().slice(0, 10);

  const { data: metricsData, error: metricsError } = await supabase
    .from("ads_metrics")
    .select("*")
    .gte("fecha", startDateStr)
    .order("fecha", { ascending: false });
  const metrics = (metricsData as AdsMetric[] | null) ?? [];

  const { data: recsData, error: recsError } = await supabase
    .from("ads_recommendations")
    .select("*")
    .order("created_at", { ascending: false });
  const recommendations = ((recsData as AdsRecommendation[] | null) ?? [])
    .slice()
    .sort((a, b) => (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1));

  const gastoTotal = metrics.reduce((sum, m) => sum + (m.gasto ?? 0), 0);
  const leadsTotal = metrics.reduce((sum, m) => sum + (m.conversiones ?? 0), 0);
  const sesionesTotal = metrics.reduce((sum, m) => sum + (m.sesiones ?? 0), 0);

  const paidMetrics = metrics.filter((m) => m.canal === "meta" || m.canal === "google_ads");
  const gastoPaid = paidMetrics.reduce((sum, m) => sum + (m.gasto ?? 0), 0);
  const conversionesPaid = paidMetrics.reduce((sum, m) => sum + (m.conversiones ?? 0), 0);
  const cplMedio = conversionesPaid > 0 ? gastoPaid / conversionesPaid : null;

  const byDate = new Map<string, AdsSpendPoint>();
  for (const m of metrics) {
    if (!byDate.has(m.fecha)) {
      byDate.set(m.fecha, { date: m.fecha, meta: 0, google_ads: 0, ga4: 0, search_console: 0 });
    }
    const bucket = byDate.get(m.fecha)!;
    if (m.canal === "meta" || m.canal === "google_ads" || m.canal === "ga4" || m.canal === "search_console") {
      bucket[m.canal] += m.gasto ?? 0;
    }
  }
  const chartData: AdsSpendPoint[] = Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({
      ...p,
      date: new Date(p.date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-ink">Ads</h1>
        <p className="text-sm text-slate-500">
          Rendimiento de Meta Ads, Google Ads, GA4 y Search Console — últimos 30 días.
        </p>
      </div>

      {(metricsError || recsError) && (
        <p className="text-sm text-red-500">{metricsError?.message ?? recsError?.message}</p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
            <div className="text-xs text-slate-500">Leads totales</div>
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
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Gasto diario por canal</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <AdsSpendChart data={chartData} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Campañas</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Dimensión</th>
                <th className="px-4 py-3 font-medium">Gasto</th>
                <th className="px-4 py-3 font-medium">CPL</th>
                <th className="px-4 py-3 font-medium">Conversiones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(m.fecha).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ADS_CANAL_LABELS[m.canal] ?? m.canal}</td>
                  <td className="px-4 py-3 text-slate-600">{m.dimension}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {m.gasto !== null ? `${m.gasto.toLocaleString("es-ES")} €` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {m.cpl !== null ? `${m.cpl.toLocaleString("es-ES")} €` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.conversiones ?? "—"}</td>
                </tr>
              ))}
              {metrics.length === 0 && (
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
