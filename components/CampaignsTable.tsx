import { ADS_CANAL_LABELS } from "@/lib/constants";
import { extraString, META_PLATFORM_LABELS } from "@/lib/ads";
import { Pager } from "@/components/Pager";
import type { AdsMetric } from "@/lib/database.types";

const PAGE_SIZE = 10;

export function CampaignsTable({
  metrics,
  page,
  pageHref,
}: {
  metrics: AdsMetric[];
  page: number;
  pageHref: (targetPage: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(metrics.length / PAGE_SIZE));
  const pageRows = metrics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Plataforma</th>
              <th className="px-4 py-3 font-medium">Anuncio / Campaña</th>
              <th className="px-4 py-3 font-medium">Gasto</th>
              <th className="px-4 py-3 font-medium">CPL</th>
              <th className="px-4 py-3 font-medium">Conversiones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(m.fecha).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3 text-slate-600">{ADS_CANAL_LABELS[m.canal] ?? m.canal}</td>
                <td className="px-4 py-3 text-slate-600">
                  {m.canal === "meta"
                    ? (() => {
                        const platform = extraString(m.extra, "publisher_platform");
                        return platform ? (META_PLATFORM_LABELS[platform] ?? platform) : "—";
                      })()
                    : "—"}
                </td>
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
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Todavía no hay datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={totalPages} pageHref={pageHref} />
    </div>
  );
}
