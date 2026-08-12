"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ADS_CANAL_LABELS } from "@/lib/constants";

export type AdsSpendPoint = {
  date: string;
  meta: number;
  google_ads: number;
  ga4: number;
  search_console: number;
};

export function AdsSpendChart({ data }: { data: AdsSpendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}€`}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
            labelStyle={{ fontWeight: 600 }}
            formatter={(value, name) => [`${Number(value).toLocaleString("es-ES")} €`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="meta" name={ADS_CANAL_LABELS.meta} fill="#1E4DF0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="google_ads" name={ADS_CANAL_LABELS.google_ads} fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ga4" name={ADS_CANAL_LABELS.ga4} fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar
            dataKey="search_console"
            name={ADS_CANAL_LABELS.search_console}
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
