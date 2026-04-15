"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TickerSummary } from "@/lib/data/portfolio";

const COLORS = [
  "#1a56db", "#057a55", "#f97316", "#7c3aed",
  "#0891b2", "#db2777", "#ca8a04", "#4338ca",
  "#dc2626", "#65a30d", "#0e9f6e", "#ff5a1f",
];

const fmt = (v: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

interface Props {
  tickers: TickerSummary[];
  total: number;
}

export default function PortfolioChart({ tickers, total }: Props) {
  const data = tickers.map((t) => ({
    ticker: t.ticker,
    value: t.valorActual,
    pct: total > 0 ? ((t.valorActual / total) * 100).toFixed(1) : "0.0",
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={95}
          outerRadius={140}
          paddingAngle={2}
          dataKey="value"
          nameKey="ticker"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => {
            const item = data.find((d) => d.ticker === name);
            return [`${fmt(value)} · ${item?.pct}%`, name];
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
