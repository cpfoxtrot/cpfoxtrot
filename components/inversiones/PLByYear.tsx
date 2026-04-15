"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import type { PLByYearRow } from "@/lib/data/analytics";
import { fmtEUR } from "@/lib/utils/format";

export default function PLByYear({ data }: { data: PLByYearRow[] }) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay posiciones cerradas todavía.</p>
      </div>
    );
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--color-muted)" }} />
          <YAxis
            tickFormatter={(v) => fmtEUR(v)}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            width={90}
          />
          <Tooltip
            formatter={(value) => {
              const num = typeof value === "number" ? value : 0;
              return [fmtEUR(num), "B/Realizado"];
            }}
          />
          <Bar dataKey="beneficioRealizado" radius={[4, 4, 0, 0]}>
            {data.map((row, i) => (
              <Cell
                key={i}
                fill={row.beneficioRealizado >= 0 ? "#10B981" : "#F43F5E"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
