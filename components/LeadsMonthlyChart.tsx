"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type LeadsMonthPoint = {
  month: string;
  capturados: number;
  enProceso: number;
  activados: number;
  perdidos: number;
};

export function LeadsMonthlyChart({ data }: { data: LeadsMonthPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="capturados" name="Capturados" fill="#1E4DF0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="enProceso" name="En proceso" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="activados" name="Activados" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="perdidos" name="Perdidos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
