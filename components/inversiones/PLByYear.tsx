"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            />
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
                  fill={row.beneficioRealizado >= 0 ? "var(--color-success)" : "var(--color-danger)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Año</th>
              <th>Operaciones</th>
              <th>B/Realizado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.year}>
                <td className="ticker-cell">{row.year}</td>
                <td>{row.numOperaciones}</td>
                <td
                  className={
                    row.beneficioRealizado > 0
                      ? "stat-positive"
                      : row.beneficioRealizado < 0
                      ? "stat-negative"
                      : ""
                  }
                >
                  {fmtEUR(row.beneficioRealizado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
